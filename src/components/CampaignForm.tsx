"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DOMPurify from "dompurify";

export default function CampaignForm() {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [recipients, setRecipients] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [type, setType] = useState("email");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!name || !content || !recipients || !scheduleTime) {
      alert("All fields are required.");
      return;
    }

    // Validate recipients (emails/phone numbers)
    const recipientArray = recipients.split(",").map((r) => r.trim());
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;

    if (
      !recipientArray.every((r) => emailRegex.test(r) || phoneRegex.test(r))
    ) {
      alert("Invalid recipient email or phone number.");
      return;
    }

    try {
      const sanitizedContent = DOMPurify.sanitize(content);

      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name,
          content: sanitizedContent, // Use sanitized content
          recipients: recipientArray,
          scheduleTime,
          type,
        }),
      });

      if (res.ok) {
        router.refresh();
      } 
      else {
        alert("Failed to create campaign");
      }
    } catch (error) {
      console.error("Error creating campaign:", error);
      alert("Failed to create campaign");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block mb-1">
          Campaign Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label htmlFor="content" className="block mb-1">
          Content
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded"
        ></textarea>
      </div>
      <div>
        <label htmlFor="recipients" className="block mb-1">
          Recipients (comma-separated)
        </label>
        <input
          type="text"
          id="recipients"
          value={recipients}
          onChange={(e) => setRecipients(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label htmlFor="scheduleTime" className="block mb-1">
          Schedule Time
        </label>
        <input
          type="datetime-local"
          id="scheduleTime"
          value={scheduleTime}
          onChange={(e) => setScheduleTime(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label htmlFor="type" className="block mb-1">
          Campaign Type
        </label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="email">Email</option>
          <option value="sms">SMS</option>
        </select>
      </div>
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Create Campaign
      </button>
    </form>
  );
}
