import { useState, useEffect, useRef } from "react";
import doctorClosed from "../assets/images/doctor-closed.png";
import doctorOpen from "../assets/images/doctor-open.png";
import "../styles/Guide.css";

const TypingIndicator = () => {
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev + 1) % 4);
    }, 400); // changes dot every 400ms
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="message-bubble" style={{ letterSpacing: "4px", fontWeight: "bold", color: "#ccc" }}>
      <span style={{ color: dotCount >= 1 ? "black" : "inherit" }}>.</span>
      <span style={{ color: dotCount >= 2 ? "black" : "inherit" }}>.</span>
      <span style={{ color: dotCount >= 3 ? "black" : "inherit" }}>.</span>
    </div>
  );
};

function Guide() {
  const [messages, setMessages] = useState([
    { text: "Hi, ask me your doubts, I would be happy to help you", sender: "bot" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTalking, setIsTalking] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [currentDoctorImage, setCurrentDoctorImage] = useState(doctorClosed);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle the talking animation loop
  useEffect(() => {
    let interval;
    if (isTalking) {
      interval = setInterval(() => {
        setCurrentDoctorImage(prev => prev === doctorClosed ? doctorOpen : doctorClosed);
      }, 200); // Swap image every 200ms
    } else {
      setCurrentDoctorImage(doctorClosed); // Default to closed mouth when not talking
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTalking]);

  const simulateTyping = (fullResponse) => {
    setIsFetching(false);
    setIsTalking(true);

    if (!fullResponse) fullResponse = "Server busy, try again.";
    const words = fullResponse.split(" ");

    // Create an empty bot message first
    setMessages(prev => [...prev, { text: "", sender: "bot" }]);

    let currentWordIndex = 0;

    const typingInterval = setInterval(() => {
      if (currentWordIndex < words.length) {
        const currentWords = words.slice(0, currentWordIndex + 1).join(" ");
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { text: currentWords, sender: "bot" };
          return newMessages;
        });
        currentWordIndex++;
      } else {
        // Finished typing
        clearInterval(typingInterval);
        setIsTalking(false);
      }
    }, 80); // Speed of typing per word
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isTalking || isFetching) return;

    // Add user message
    const userMessage = inputValue.trim();
    setMessages(prev => [...prev, { text: userMessage, sender: "user" }]);
    setInputValue("");
    
    setIsFetching(true);
    setIsTalking(false); // Stop talking while fetching

    const lowerMessage = userMessage.toLowerCase();

    // Hybrid Logic Check
    if (lowerMessage.includes("how to report")) {
      simulateTyping("Go to Post → upload image → add location → submit.");
      return;
    } else if (lowerMessage.includes("emergency") || lowerMessage.includes("injured")) {
      simulateTyping("Approach carefully, avoid sudden movement, and contact nearest vet immediately.");
      return;
    }

    // Backend API Call
    try {
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: userMessage }]
        }),
      });

      if (!response.ok) {
        throw new Error("Server error");
      }

      const data = await response.json();
      simulateTyping(data.reply);
    } catch (error) {
      console.error("API fetch failed:", error);
      simulateTyping("Server busy, try again.");
    }
  };

  return (
    <div className="guide-page">
      <div className="guide-container">

        {/* Character Image Section */}
        <div className="character-section">
          <img
            src={currentDoctorImage}
            alt="Doctor Guide"
            className="character-image"
          />
        </div>

        {/* Chat UI Section */}
        <div className="chat-section">
          <div className="chat-history">
            {messages.map((msg, index) => (
              <div key={index} className={`chat-message ${msg.sender}`}>
                <div className="message-bubble">
                  {msg.text}
                </div>
              </div>
            ))}
            {isFetching && (
              <div className="chat-message bot">
                <TypingIndicator />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-container" onSubmit={handleSendMessage}>
            <input
              type="text"
              className="chat-input"
              placeholder="Ask me something..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isTalking || isFetching}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={isTalking || isFetching || !inputValue.trim()}
            >
              Send
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default Guide;