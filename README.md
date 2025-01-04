## **Email/SMS campaign management system**

### **Overview**

This project is a real-time campaign management system that leverages RabbitMQ for message queuing and WebSocket (Socket.IO) for real-time client notifications. It allows users to create and manage campaigns with live updates on campaign scheduling, execution, and status changes.

---

### **How to Run the Application Locally**

#### **Prerequisites**
1. **Node.js**: Install Node.js (v16 or higher).
2. **RabbitMQ**: Install RabbitMQ or run it using Docker.

#### **Steps**
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start RabbitMQ:
   - Using Docker:
     ```bash
     docker run -d --hostname rabbitmq --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
     ```
   - Access RabbitMQ Management UI at `http://localhost:15672` (Default credentials: `guest` / `guest`).

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open the application in your browser:
   ```
   http://localhost:3000
   ```

---

### **Project Architecture**

#### **Key Components**

1. **Campaign Form (`components/CampaignForm.tsx`)**
   - Allows users to create campaigns by providing details like name, content, recipients, schedule time, and type (email/SMS).
   - Validates input data, sanitizes content, and submits campaigns via the `/api/campaigns` endpoint.

2. **Campaign List (`components/CampaignList.tsx`)**
   - Displays a paginated list of campaigns.
   - Updates dynamically using WebSocket notifications.

3. **Notification Component (`components/NotificationComponent.tsx`)**
   - Provides real-time visual notifications for various campaign-related events (e.g., scheduling, success, failure).
   - Connects to WebSocket and listens for event updates.

4. **RabbitMQ Service (`lib/rabbitService.ts`)**
   - Manages the RabbitMQ connection and provides methods for publishing messages.
   - Ensures durable and persistent message delivery to RabbitMQ queues.

5. **Socket.IO Service (`lib/socketService.ts`)**
   - Manages WebSocket connections and integrates RabbitMQ with the WebSocket server.
   - Consumes RabbitMQ messages and forwards them to connected WebSocket clients.
   - Implements fallback logic to emit messages directly via WebSocket if RabbitMQ is unavailable.

6. **API Endpoints (`app/api`)**
   - `/api/campaigns`:
     - Handles campaign creation, validation, and scheduling.
     - Publishes messages to RabbitMQ for processing.
   - `/api/socket`:
     - Initializes the WebSocket server.

---

### **Description of Workflow**

1. **Campaign Creation**
   - A user submits a campaign via the form.
   - The campaign is validated, sanitized, and sent to the `/api/campaigns` endpoint.
   - The API publishes the campaign details to RabbitMQ and notifies WebSocket clients in real time.

2. **Message Processing**
   - RabbitMQ acts as a message broker for campaign events.
   - The `SocketService` consumes messages from RabbitMQ, processes them, and emits updates to WebSocket-connected clients.

3. **Real-Time Updates**
   - Clients receive updates such as `campaignScheduled` via WebSocket and dynamically update the UI.

---

### **Assumptions Made During Development**

1. **RabbitMQ Availability**:
   - The system assumes RabbitMQ is running for reliable message queuing.
   - If RabbitMQ is unavailable, messages are directly sent via WebSocket as a fallback.

2. **Message Format**:
   - All RabbitMQ messages follow a JSON structure with `event` and `data` keys.

3. **Recipient Validation**:
   - Campaign recipients are validated as either emails or phone numbers based on simple regex patterns.

4. **Authentication**:
   - Campaign API endpoints require an `Authorization` header with a Bearer token (assumed for demonstration purposes).

---

### **Key Features**

- **Real-Time Updates**:
  - Instant feedback on campaign scheduling and execution via WebSocket.

- **Message Durability**:
  - Campaign messages are persisted in RabbitMQ queues to ensure reliability.

- **Fallback Logic**:
  - If RabbitMQ is unavailable, WebSocket emits messages directly to clients.

- **Modular Design**:
  - Separation of concerns with dedicated services for RabbitMQ, WebSocket, and notifications.

---

### **Testing**

1. **API Testing**:
   - Use tools like Postman to test `/api/campaigns` for campaign creation and retrieval.

2. **WebSocket Testing**:
   - Monitor browser console logs for real-time WebSocket updates.

3. **RabbitMQ Monitoring**:
   - Verify queue bindings, message flow, and acknowledgment in the RabbitMQ Management UI.

4. **Simulating RabbitMQ Failure**:
   - Stop RabbitMQ to test the fallback logic in `SocketService`.

---

### **Future Enhancements**

1. **Error Handling**:
   - Improve retry mechanisms for RabbitMQ and WebSocket failures.
   - Implement dead-letter queues for unprocessable messages.

2. **Authentication**:
   - Integrate user authentication for WebSocket and API endpoints.

3. **Extensibility**:
   - Add support for additional campaign types or notification mechanisms.

4. **Scalability**:
   - Deploy RabbitMQ and WebSocket servers in a distributed environment for high availability.
