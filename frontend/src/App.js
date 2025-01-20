import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [customerId, setCustomerId] = useState("");
  const [usdtAddress, setUsdtAddress] = useState("");
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
  const [validationErrors, setValidationErrors] = useState({});
  const [files, setFiles] = useState([]);
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

  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  const validateField = (field, value) => {
    let error = "";
    if (value) {
      switch (field) {
        case "email":
          error = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Enter a valid email address.";
          break;
        case "phone":
          error = /^\d{10}$/.test(value) ? "" : "Enter a 10-digit Indian phone number.";
          break;
        case "idNumber":
          if (idType === "PAN Card") {
            error = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value) ? "" : "Enter a valid PAN (ABCDE1234F).";
          } else if (idType === "Aadhar Card") {
            error = /^\d{12}$/.test(value) ? "" : "Enter a valid 12-digit Aadhar number.";
          } else if (idType === "Driving License") {
            error = /^[A-Z]{2}\d{2} ?\d{7}$/.test(value) ? "" : "Enter a valid driving license (e.g., MH14 1234567).";
          }
          break;
        default:
          error = value ? "" : "This field is required.";
      }
    } else {
      error = "This field is required.";
    }
    console.log(error, field);
    setValidationErrors((prevErrors) => ({ ...prevErrors, [field]: error }));
    console.log(Object.keys(validationErrors).length);

  };

  const startRecording = async () => {
    if (confirmation) {
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
          //videoChunks.current = [];

          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
      } catch (error) {
        console.error("Error accessing camera:", error);
      }
    } else {
      alert("Please confirm the form before starting the recording.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = async () => {
    // Create a new Blob from the video chunks
    const blob = new Blob(videoChunks.current, { type: "video/mp4" });
    const timestamp = new Date().toISOString().replace(/:/g, "-");
    const fileName = `${name}_${phone}_${timestamp}.mp4`;
    console.log(blob);
    console.log(fileName);

    // Create FormData object
    const formData = new FormData();
    formData.append("video", blob, fileName);
    formData.append("customerId", customerId);
    formData.append("name", name); //name is appended
    formData.append("email", email);
    formData.append("usdtAddress", usdtAddress); //phone is appended
    formData.append("phone", phone); //phone is appended
    formData.append("idType", idType);
    formData.append("idNumber", idNumber)
    console.log(formData.get("blob"));

    try {
      const response = await axios.post("http://localhost:5000/upload", formData, {
        // const response = await axios.post("https://api.sgservices.in/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadStatus("Video uploaded successfully!");
    } catch (error) {
      console.error("Error uploading video:", error); // Log the error for debugging
      setUploadStatus("Failed to upload video.");
    }
  };

  // const confirmForm = () => {
  //   const fields = ["customerId", "name", "email", "phone", "idNumber"];
  //   fields.forEach((field) => validateField(field, eval(field))); // Validates all fields

  //   if (Object.values(validationErrors).every((error) => error === "")) {
  //     setConfirmation(true);
  //   } else {
  //     alert("Please correct the errors before confirming.");
  //   }
  // };
  const confirmForm = () => {
    const errors = {};
    ["customerId", "name", "email", "phone", "idNumber"].forEach((field) => {
      validateField(field, eval(field));
      errors[field] = validationErrors[field];
    });
    console.log(errors);
    
    if (Object.values(errors).every((error) => error === "")) {
      setConfirmation(true);
    } else {
      alert("Please correct the errors before confirming.");
    }
  };

  const listenInEnglish = () => {
    const speechSynth = window.speechSynthesis;
    const enteredText = 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Dignissimos qui distinctio iusto reiciendis, magnam perferendis repellat fugit amet itaque doloribus illo ad, quasi, necessitatibus accusamus enim odio numquam odit maxime?';
    if (!speechSynth.speaking && enteredText.trim().length) {
      const newUtter =
        new SpeechSynthesisUtterance(enteredText);
      speechSynth.speak(newUtter);
    }

  }

  const listenInTelugu = () => {
    const speechSynth = window.speechSynthesis;
    const enteredText = 'లోరెమ్ ఇప్సమ్ డోలర్ సిట్ అమెట్ కన్సెక్టెచర్ ఎలిట్ ఎలిట్. డిగ్నిస్సిమోస్ క్వి డిస్టింక్టియో ఐయుస్టో రీసియెండిస్, మాగ్నమ్ పర్ఫెరెండిస్ రిపెల్లట్ ఫుజిట్ అమెట్ ఇటాక్ డోలోరిబస్ ఇల్లో యాడ్, క్వసి, నెసెసిటాట్ బస్ అక్కామాస్ ఎనిమ్ ఒడియో నమ్క్వామ్ ఒడిట్ మ్యాగ్జిమ్?'; // Telugu text for "Hi Gaurav, how are you?"

    const voices = speechSynth.getVoices();
    const teluguVoice = voices.find(voice => voice.lang === "te-IN"); // Find a Telugu voice

    if (teluguVoice) {
      const newUtter = new SpeechSynthesisUtterance(enteredText);
      newUtter.lang = "te-IN";
      newUtter.voice = teluguVoice; // Set the Telugu voice
      speechSynth.speak(newUtter);
    } else {
      console.error("Telugu voice not available.");
    }

  }

  return (
    <>
      <img src="/logo1.png" style={{ width: '100px', margin: '10px', position: 'static' }} />
      <div className="text-center">
        <p style={{ fontSize: '64px', color: 'white', fontWeight: 'bold' }}>EXPERT INFRA MONEY</p>
        <p style={{ fontSize: '54px', color: 'white', fontWeight: 'bold' }}>KYC PLATFORM</p>
        {/* <img src="/background.png" style={{ width: '80%' }} /> */}
      </div>
      <div style={{ marginTop: '20px', backgroundColor: 'rgba(104, 103, 103, 0.43)', color: 'white' }} className="App">
        <h1 style={{ color: 'white' }}>Expert Infra Money - Video KYC Platform</h1>
        <form className="form">
          <div className="row comFields">
            {["customerId", "name", "email", "phone"].map((field) => (
              <div key={field} style={{ display: 'inline' }} className="col-lg-6 col-sm-12">
                <label>{field.charAt(0).toUpperCase() + field.slice(1)} <span style={{ color: "red" }}>*</span>:</label>
                <input
                  className="input-field"
                  value={eval(field)}
                  onChange={(e) => eval(`set${field.charAt(0).toUpperCase() + field.slice(1)}`)(e.target.value)}
                  onBlur={() => validateField(field, eval(field))}
                />
                {validationErrors[field] && <small className="error">{validationErrors[field]}</small>}
              </div>
            ))}
          </div>
          <div className="row">
            <div className="col-lg-6 col-sm-12">
              <label>Identity Proof <span style={{ color: "red" }}>*</span>:</label>
              <select className="select-field" value={idType} onChange={(e) => {
                setIdType(e.target.value);
                setIdNumber(""); // Clear ID number on type change
                setValidationErrors({ ...validationErrors, idNumber: "" }); // Reset validation error
              }}>
                <option value="PAN Card">PAN Card</option>
                <option value="Aadhar Card">Aadhar Card</option>
                <option value="Driving License">Driving License</option>
              </select>
            </div>
            <div className="col-lg-6 col-sm-12">
              <label>{idType} Number <span style={{ color: "red" }}>*</span>:</label>
              <input
                className="input-field"
                value={idNumber}
                onChange={(e) => {
                  setIdNumber(e.target.value);
                  validateField("idNumber", e.target.value);
                }}
                onBlur={() => validateField("idNumber", idNumber)}
              />
              {validationErrors.idNumber && <small className="error">{validationErrors.idNumber}</small>}
            </div>
          </div>

          <div className="row">
            <div className="col-lg-6 col-sm-12">
              <label>Select Video Device <span style={{ color: "red" }}>*</span>:</label>
              <select className="select-field" onChange={(e) => setSelectedVideoDevice(e.target.value)} value={selectedVideoDevice}>
                {devices.video.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>{device.label || "Camera"}</option>
                ))}
              </select>
            </div>
            <div className="col-lg-6 col-sm-12">
              <label>Select Audio Device <span style={{ color: "red" }}>*</span>:</label>
              <select className="select-field" onChange={(e) => setSelectedAudioDevice(e.target.value)} value={selectedAudioDevice}>
                {devices.audio.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>{device.label || "Microphone"}</option>
                ))}
              </select>
            </div>  
            <div className="col-sm-12 col-lg-6">
              <label>Upload Identity Proof Images <span style={{ color: "red" }}>*</span>:</label>
              <input onChange={handleFileChange} style={{ width: '100%' }} className="form-control" type="file" multiple name="file1" id="file1" />
              <small style={{ fontSize: "12px" }}>Both Front & Back Side. Maximum File Size should be less than 5MB</small>
            </div>
            <div class="col-lg-6 col-sm-12" style={{display: "inline"}}>
              <label>USDT Address <span style={{color: "red"}}>*</span>:</label>
              <input class="input-field" onChange={(e) => setUsdtAddress(e.target.value)} required data-listener-added_db9b6be3="true"/>
                {/* <small class="error">This field is required.</small> */}
            </div>

          </div>
        </form>

        {!confirmation && (
          <button className="confirm-button" onClick={confirmForm}>Confirm Form</button>
        )}

        {/* {confirmation && ( */}
        {/* <div> */}
        {isRecording ? (''
          // <button disabled={!confirmation} className="record-button" onClick={stopRecording}>Stop Recording</button>
        ) : (
          <button disabled={!confirmation} className="record-button mx-2" onClick={startRecording}>Start Recording</button>
        )}
        {/* </div> */}
        {/* )} */}


        <div style={{ backgroundColor: 'rgba(226, 222, 222, 0.43)', padding: '20px', borderRadius: '20px' }}>
          <p>Respected <br/>
MD and CEO of EXPERT INFRA COMPANY,  <br/>
Ananthula Satish Goud Garu,  <br/>

Sir,  <br/>
My name is --------------------  <br/>
Father’s Name --------------------  <br/>
Village --------------------  <br/>
District --------------------  <br/>
State --------------------  <br/>
My EIM ID --------------------  <br/><br/>

I had invested an amount of Rs. -------------------- (in words: --------------------) on the date ----------, month --------, year --------, in the EXPERT INFRA Company to purchase EXPERT INFRA MONEY TOKENS amounting to -------------------- (in words: --------------------).  <br/>

Today, due to my personal emergencies, I have decided to sell all the EXPERT INFRA MONEY TOKENS in my possession back to you with my full consent.  <br/>

I kindly request you to return the total value of the EXPERT INFRA MONEY TOKENS I invested, which amounts to -------------------- (in words: --------------------) including interest, in the form of USDT, and credit the same to my WALLET.  <br/>

I am pleased to inform you that the amount of -------------------- USDT (in words: -------------------- USDT) has been credited to my WALLET ADDRESS -------------------- on the date ----------, month --------, year --------.  <br/>

From this day onwards, I declare that I have no further association with the MD and CEO of EXPERT INFRA Company, Satish Goud Garu, or with any employees and staff of EXPERT INFRA. Additionally, I confirm that I have no business transactions or dealings with the company.  <br/>

I hereby state, in this video, that starting from today, i.e., date --------, month --------, year --------, I will not be involved in any form of misconduct, legal or illegal issues, either directly or indirectly, related to EXPERT INFRA Company, its management, or its employees.  <br/>

I swear in the presence of God that if I am found to be the cause of any such issues in the future, I give my complete consent to take legal action against me, and I authorize you with full rights to do so.  <br/>

I declare that all the details mentioned above are provided by me with full consciousness and understanding.  <br/>

Finally, I extend my heartfelt gratitude to Ananthula Satish Goud Garu for your cooperation and conclude this video.  <br/><br/>

Sincerely,  <br/>
XXXXXXXXX</p>
          <button onClick={listenInEnglish} className="btn btn-light">Listen In English</button>
          <button onClick={listenInTelugu} className="btn mx-2 btn-light" >తెలుగులో వినండి</button>
        </div>
        <div className="preview">
          <h3>{isRecording ? "Recording..." : "Preview"}</h3>
          <video ref={videoRef} autoPlay muted style={{ backgroundColor: 'black' }} />
          {isRecording ? (
            <button disabled={!confirmation} className="record-button" onClick={stopRecording}>Stop Recording</button>
          ) : (''
            // <button disabled={!confirmation} className="record-button" onClick={startRecording}>Start Recording</button>
          )}

          <p style={{ textAlign: 'left' }}>Kindly preview your recorded video, if the audio and video quality is clear, then submit</p>

          {videoUrl && <video src={videoUrl} controls />}
        </div>

        <label>
          <input
            type="checkbox" style={{ marginRight: '10px' }}
            checked={confirmation}
            onChange={() => setConfirmation(!confirmation)}
          />
          I confirm that I have recorded this video and consent to share.
        </label>

        {confirmation && (
          <button className="submit-button m-auto" style={{width:'100%'}} onClick={handleSubmit}>Submit</button>
        )}

        <div>{uploadStatus}</div>
      </div>
    </>
  );
}

export default App;
