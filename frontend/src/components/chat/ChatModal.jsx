import { useState, useEffect, useRef } from "react";
import API from "../../api/axios";
import { toast } from "react-toastify";

export default function ChatModal({
  isOpen,
  onClose,
  conversationId,
  recipientId,
  recipientName,
  recipientRole,
  title,
}) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const currentUserId = (() => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return null;
      const u = JSON.parse(userStr);
      return u._id || u.id;
    } catch {
      return null;
    }
  })();

  const fetchMessages = async () => {
    if (!conversationId) return;
    try {
      const token = localStorage.getItem("token");
      const res = await API.get(`/chat/messages/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setMessages(res.data.messages || []);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && conversationId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, conversationId]);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const targetReceiverId = typeof recipientId === "object" ? recipientId?._id || recipientId?.userId : recipientId;
    if (!inputMessage.trim() || !targetReceiverId) return;

    setSending(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.post(
        "/chat/messages",
        {
          conversationId,
          receiverId: targetReceiverId,
          message: inputMessage.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setInputMessage("");
        setMessages((prev) => [...prev, res.data.message]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: 20,
          width: "100%",
          maxWidth: 520,
          height: 600,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            background: "linear-gradient(135deg, #0f172a, #1e293b)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "#0891b2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 16,
                color: "#ffffff",
              }}
            >
              {(recipientName || "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 6 }}>
                {recipientName || "Chat Logistics"}
                {recipientRole && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: "rgba(255,255,255,0.2)",
                      textTransform: "capitalize",
                    }}
                  >
                    {recipientRole}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                {title || "Logistics & Delivery Coordination"}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              color: "#fff",
              width: 32,
              height: 32,
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Message Area */}
        <div
          style={{
            flex: 1,
            padding: 20,
            overflowY: "auto",
            background: "#f8fafc",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {loading ? (
            <div style={{ textAlign: "center", margin: "auto", color: "#64748b", fontSize: 14 }}>
              Loading messages…
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: "center", margin: "auto", color: "#94a3b8" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>💬</div>
              <div style={{ fontWeight: 700, color: "#334155" }}>No messages yet</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                Send a message to coordinate pickup time, location, or instructions.
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isSender =
                msg.sender?._id?.toString() === currentUserId?.toString() ||
                msg.sender?.toString() === currentUserId?.toString();

              return (
                <div
                  key={msg._id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isSender ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "80%",
                      padding: "10px 14px",
                      borderRadius: 16,
                      borderBottomRightRadius: isSender ? 2 : 16,
                      borderBottomLeftRadius: isSender ? 16 : 2,
                      background: isSender ? "#0891b2" : "#ffffff",
                      color: isSender ? "#ffffff" : "#0f172a",
                      fontSize: 14,
                      lineHeight: 1.45,
                      boxShadow: "0 2px 8px rgba(15,23,42,0.05)",
                      border: isSender ? "none" : "1px solid #e2e8f0",
                    }}
                  >
                    {msg.message}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#94a3b8",
                      marginTop: 4,
                      padding: "0 4px",
                    }}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          style={{
            padding: "14px 16px",
            background: "#ffffff",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            gap: 10,
          }}
        >
          <input
            type="text"
            placeholder="Type your message…"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: 20,
              border: "1px solid #cbd5e1",
              fontSize: 14,
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={sending || !inputMessage.trim()}
            style={{
              padding: "10px 20px",
              borderRadius: 20,
              border: "none",
              background: sending || !inputMessage.trim() ? "#cbd5e1" : "#0891b2",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: 14,
              cursor: sending || !inputMessage.trim() ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
