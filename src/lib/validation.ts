// lib/validation.ts
import { z } from 'zod';

export const campaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  content: z.string().min(1, 'Content is required'),
  recipients: z.array(
    z.string().refine(
      (recipient) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient) || /^\+?[1-9]\d{1,14}$/.test(recipient),
      {
        message: 'Invalid email or phone number',
      }
    )
  ),
  scheduleTime: z.string().refine((date) => !isNaN(new Date(date).getTime()), {
    message: 'Invalid schedule time',
  }),
  type: z.enum(['email', 'sms'], { required_error: 'Type is required' }),
});
