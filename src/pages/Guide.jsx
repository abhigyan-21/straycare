import { useState, useEffect, useRef } from "react";
import doctorClosed from "../assets/images/doctor-closed.png";
import doctorOpen from "../assets/images/doctor-open.png";
import "../styles/Guide.css";

function Guide() {
  const [messages, setMessages] = useState([
    { text: "Hi, ask me your doubts, I would be happy to help you", sender: "bot" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTalking, setIsTalking] = useState(false);
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

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isTalking) return;

    // Add user message
    const userMessage = inputValue.trim();
    setMessages(prev => [...prev, { text: userMessage, sender: "user" }]);
    setInputValue("");
    setIsTalking(true);

    const dummyResponses = [
      "That's a great question about pets! Ensuring they have a balanced diet is very important.",
      "If you see a stray dog in an emergency, you should use our Emergency page immediately.",
      "Make sure your pet is vaccinated. It is crucial for their well-being.",
      "I recommend visiting a local vet to get a proper checkup for that specific issue.",
      "Adopting a dog is a wonderful thing! Have you checked our Adopt section?"
    ];
    const fullResponse = dummyResponses[Math.floor(Math.random() * dummyResponses.length)];
    const words = fullResponse.split(" ");

    // Create an empty bot message first
    setMessages(prev => [...prev, { text: "", sender: "bot" }]);

    let currentWordIndex = 0;

    const typingInterval = setInterval(() => {
      if (currentWordIndex < words.length) {
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          // Append the next word
          lastMessage.text = (lastMessage.text + " " + words[currentWordIndex]).trim();
          return newMessages;
        });
        currentWordIndex++;
      } else {
        // Finished typing
        clearInterval(typingInterval);
        setIsTalking(false);
      }
    }, 150); // Speed of typing per word
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
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-container" onSubmit={handleSendMessage}>
            <input
              type="text"
              className="chat-input"
              placeholder="Ask me something..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isTalking}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={isTalking || !inputValue.trim()}
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