import { Server } from "socket.io";

const io = new Server(3003, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
}

console.log("Notification service running on port 3003");

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Join a user-specific room
  socket.on("join", (userId: string) => {
    socket.join(`user:${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  // Handle new book notification
  socket.on("new-book", (data: { userId: string; bookTitle: string }) => {
    io.emit("book-updated", {
      type: "new-book",
      message: `New book "${data.bookTitle}" has been added!`,
    });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Export for use in API routes
export { io };
