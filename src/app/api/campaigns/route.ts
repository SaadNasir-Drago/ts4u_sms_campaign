// app/api/campaigns/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Campaign from '@/models/campaign';
import SocketService from '@/lib/socketService';
import { campaignSchema } from '@/lib/validation';
import { rateLimiter } from '@/lib/rateLimiter';
import DOMPurify from 'isomorphic-dompurify';
import RabbitService from '@/lib/rabbitService';

// CSP policy
const csp = {
  'Content-Security-Policy': [
    "default-src 'self';",
    "script-src 'self';",
    "style-src 'self' 'unsafe-inline';",
    "img-src 'self' data:;",
    "connect-src 'self';",
    "object-src 'none';",
    "base-uri 'self';",
    "form-action 'self';",
  ].join(' '),
};

export async function GET(req: NextRequest) {
  try {
    await rateLimiter(req);
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const campaigns = await Campaign.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await Campaign.countDocuments();
    const totalPages = Math.ceil(totalCount / limit);

    const response = NextResponse.json({
      campaigns,
      totalPages,
      currentPage: page,
    });

    // Add CSP header to the response
    response.headers.set('Content-Security-Policy', csp['Content-Security-Policy']);
    return response;
  } catch (error: any) {
    if (error.name === 'RateLimitError') {
      const response = NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
      response.headers.set('Content-Security-Policy', csp['Content-Security-Policy']);
      return response;
    }

    const response = NextResponse.json(
      { error: error.message || 'Failed to fetch campaigns' },
      { status: 500 }
    );
    response.headers.set('Content-Security-Policy', csp['Content-Security-Policy']);
    return response;
  }
}

export async function POST(req: NextRequest) {
  try {
    await rateLimiter(req);
    await dbConnect();

    const body = await req.json();

    // Validate request body
    const parsedBody = campaignSchema.parse(body);

    const { name, content, recipients, scheduleTime, type } = parsedBody;

    // Sanitize inputs
    const sanitizedContent = DOMPurify.sanitize(content);
    const sanitizedName = DOMPurify.sanitize(name);

    const campaign = await Campaign.create({
      name: sanitizedName,
      content: sanitizedContent,
      recipients,
      scheduleTime: new Date(scheduleTime),
      type,
    });

    const socketService = SocketService.getInstance();
    socketService.emitEvent('campaignScheduled', {
      name: campaign.name,
      id: campaign._id,
      type: campaign.type,
      scheduleTime: campaign.scheduleTime,
    });
    
    // Publish to RabbitMQ (will skip if offline)
    const rabbitService = await RabbitService.getInstance();
    await rabbitService.publish('campaigns', {
      event: 'campaignScheduled',
      data: {
        name: campaign.name,
        id: campaign._id,
        type: campaign.type,
        scheduleTime: campaign.scheduleTime,
      },
    });

    const response = NextResponse.json({ success: true, data: campaign }, { status: 201 });

    // Add CSP header to the response
    response.headers.set('Content-Security-Policy', csp['Content-Security-Policy']);
    return response;
  } catch (error: any) {
    if (error.name === 'RateLimitError') {
      const response = NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
      response.headers.set('Content-Security-Policy', csp['Content-Security-Policy']);
      return response;
    }

    const response = NextResponse.json(
      { success: false, error: error.message },
      { status: error.name === 'ZodError' ? 400 : 500 }
    );
    response.headers.set('Content-Security-Policy', csp['Content-Security-Policy']);
    return response;
  }
}
