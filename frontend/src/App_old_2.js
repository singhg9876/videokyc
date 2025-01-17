import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [customerId, setCustomerId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [idType, setIdType] = useState("PAN Card");
  const [idNumber, setIdNumber] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [confirmation, setConfirmation] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [devices, setDevices] = useState({ video: [], audio: [] });
  const [selectedVideoDevice, setSelectedVideoDevice] = useState("");
  const [selectedAudioDevice, setSelectedAudioDevice] = useState("");
  const mediaRecorderRef = useRef(null);
  const videoChunks = useRef([]);
  const videoRef = useRef(null);

  useEffect(() => {
    async function getDevices() {
      const deviceInfos = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = deviceInfos.filter(device => device.kind === "videoinput");
      const audioDevices = deviceInfos.filter(device => device.kind === "audioinput");
      setDevices({ video: videoDevices, audio: audioDevices });
    }
    getDevices();
  }, []);

  // Validation functions
  const validatePhone = (number) => /^\d{10}$/.test(number);
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePan = (pan) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
  const validateAadhar = (aadhar) => /^\d{12}$/.test(aadhar);
  const validateDrivingLicense = (license) => /^[A-Z]{2}\d{2} ?\d{7}$/.test(license);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: selectedVideoDevice || undefined },
        audio: { deviceId: selectedAudioDevice || undefined },
      });

      videoRef.current.srcObject = stream;
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

        stream.getTracks().forEach((track) => track.stop());
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
  };

  const reRecord = () => {
    setVideoUrl(null);
    setConfirmation(false);
    setIsRecording(false);
  };

  const handleSubmit = async () => {
    if (!confirmation) {
      alert("Please confirm your recording.");
      return;
    }

    const blob = new Blob(videoChunks.current, { type: "video/mp4" });
    const timestamp = new Date().toISOString().replace(/:/g, "-");
    const fileName = `${name}_${phone}_${timestamp}.mp4`;

    const formData = new FormData();
    formData.append("video", blob, fileName);
    formData.append("customerId", customerId);
    formData.append("name", name);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("idType", idType);
    formData.append("idNumber", idNumber);

    try {
      const response = await axios.post("http://localhost:5000/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setUploadStatus("Video uploaded successfully!");
    } catch (error) {
      setUploadStatus("Failed to upload video.");
    }
  };

  const validateIdNumber = () => {
    switch (idType) {
      case "PAN Card":
        return validatePan(idNumber);
      case "Aadhar Card":
        return validateAadhar(idNumber);
      case "Driving License":
        return validateDrivingLicense(idNumber);
      default:
        return false;
    }
  };

  return (
    <div className="App">
      <h1>Export Infra Money - Video KYC Platform</h1>
      <form className="form">
        <label>Customer ID:</label>
        <input value={customerId} onChange={(e) => setCustomerId(e.target.value)} />

        <label>Name:</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />

        <label>Email ID:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ borderColor: validateEmail(email) ? "initial" : "red" }}
        />

        <label>Phone Number:</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{ borderColor: validatePhone(phone) ? "initial" : "red" }}
        />

        <label>Identity Proof:</label>
        <select value={idType} onChange={(e) => setIdType(e.target.value)}>
          <option value="PAN Card">PAN Card</option>
          <option value="Aadhar Card">Aadhar Card</option>
          <option value="Driving License">Driving License</option>
        </select>

        <label>{idType} Number:</label>
        <input
          value={idNumber}
          onChange={(e) => setIdNumber(e.target.value)}
          style={{ borderColor: validateIdNumber() ? "initial" : "red" }}
        />

        <label>Select Video Device:</label>
        <select onChange={(e) => setSelectedVideoDevice(e.target.value)} value={selectedVideoDevice}>
          {devices.video.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>{device.label || "Camera"}</option>
          ))}
        </select>

        <label>Select Audio Device:</label>
        <select onChange={(e) => setSelectedAudioDevice(e.target.value)} value={selectedAudioDevice}>
          {devices.audio.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>{device.label || "Microphone"}</option>
          ))}
        </select>
      </form>

      <div className="controls">
        {isRecording ? (
          <button onClick={stopRecording}>Stop Recording</button>
        ) : (
          <button onClick={startRecording}>Start Recording</button>
        )}
        <button onClick={reRecord} disabled={!videoUrl}>Re-record</button>
      </div>

      <div className="preview">
        <h3>{isRecording ? "Recording..." : "Preview"}</h3>
        {isRecording ? (
          <video ref={videoRef} autoPlay playsInline muted />
        ) : (
          videoUrl && <video src={videoUrl} controls />
        )}
      </div>

      <label>
        <input type="checkbox" checked={confirmation} onChange={() => setConfirmation(!confirmation)} />
        I confirm that I have recorded this video for verification purposes.
      </label>

      <button
        onClick={handleSubmit}
        disabled={!confirmation || !videoUrl || !validatePhone(phone) || !validateEmail(email) || !validateIdNumber()}
      >
        Submit Video
      </button>
      
      {uploadStatus && <p>{uploadStatus}</p>}
    </div>
  );
}

export default App;
