import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [idType, setIdType] = useState("PAN Card");
  const [idNumber, setIdNumber] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [stream, setStream] = useState(null); // New state to hold video stream
  const mediaRecorderRef = useRef(null);
  const videoChunks = useRef([]);
  const videoRef = useRef(null);

  useEffect(() => {
    // Stop the stream when component unmounts
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(stream); // Store the stream in state
      if (videoRef.current) {
        videoRef.current.srcObject = stream; // Set stream to video for live preview
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      mediaRecorder.ondataavailable = (event) => {
        videoChunks.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(videoChunks.current, { type: "video/mp4" });
        const videoURL = URL.createObjectURL(blob);
        setVideoUrl(videoURL);
        videoChunks.current = [];
      };

      mediaRecorder.start();
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleSubmit = async () => {
    if (!name || !phone || !idNumber) {
      alert("Please fill in all fields.");
      return;
    }

    const blob = new Blob(videoChunks.current, { type: "video/mp4" });
    const formData = new FormData();
    formData.append("video", blob, `${name}-${Date.now()}.mp4`);
    formData.append("name", name);
    formData.append("phone", phone);
    formData.append("idType", idType);
    formData.append("idNumber", idNumber);

    try {
      const response = await axios.post("http://localhost:5000/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      alert(response.data.message);
    } catch (error) {
      alert("Error uploading video");
    }
  };

  return (
    <div className="App">
      <h1>Video KYC Platform</h1>
      <form className="form">
        <label>Name:</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />
        <label>Phone Number:</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        <label>ID Type:</label>
        <select value={idType} onChange={(e) => setIdType(e.target.value)}>
          <option value="PAN Card">PAN Card</option>
          <option value="Aadhar Card">Aadhar Card</option>
        </select>
        <label>{idType} Number:</label>
        <input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
      </form>
      <div className="controls">
        {isRecording ? (
          <button onClick={stopRecording}>Stop Recording</button>
        ) : (
          <button onClick={startRecording}>Start Recording</button>
        )}
      </div>
      <div className="preview">
        <h3>{isRecording ? "Recording..." : "Preview"}</h3>
        {/* Display live preview when recording; otherwise, display recorded video */}
        {isRecording ? (
          <video ref={videoRef} autoPlay playsInline muted /> // Live preview
        ) : (
          videoUrl && <video src={videoUrl} controls />
        )}
        {!isRecording && videoUrl && (
          <button onClick={handleSubmit}>Submit Video</button>
        )}
      </div>
    </div>
  );
}

export default App;
