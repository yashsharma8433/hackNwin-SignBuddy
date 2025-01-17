import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Speech from 'expo-speech';

const Blind = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [ranOnce, setRanOnce] = useState(false);
  const cameraRef = useRef(null);
  const speak = (ss) => {
    const thingToSay = ss;
    const speakOptions = {
      rate: 0.5, // Adjust the rate to slow down the speech (0.5 is half of the normal speed)
    };
    Speech.speak(thingToSay, speakOptions);
  };
  
  


  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);
  useEffect(() => {
    if (!ranOnce) {
      const timeoutId = setTimeout(() => {
        takePicture();
        setRanOnce(true); // Set the state to true after the initial run
      }, 3000);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [ranOnce]);
  

  useEffect(() => {

    const intervalId = setInterval(() => {
      takePicture();
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const { uri } = await cameraRef.current.takePictureAsync();
        console.log('Photo taken:', uri);
        setCapturedPhoto(uri);
        await MediaLibrary.saveToLibraryAsync(uri);

        // Send the photo file to localhost:5000/video
        const formData = new FormData();
        formData.append('file', {
          uri: uri,
          name: 'photo.jpg',
          type: 'image/jpeg', // Set the correct MIME type for the image file
        });

        const response = await fetch('https://6fc2-112-196-37-184.ngrok-free.app/photo', {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        const res = await response.json();
        console.log(res.result);
        speak(res.result);
        // console.log('Server response:', response.result);
      } catch (error) {
        console.error('Failed to take picture:', error);
      }
    }
  };

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  const flipCamera = () => {
    setType(
      type === Camera.Constants.Type.back
        ? Camera.Constants.Type.front
        : Camera.Constants.Type.back
    );
  };

  return (
    <View style={styles.container}>
      <Camera style={styles.camera} type={type} ref={cameraRef}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={flipCamera}> 
            <Text style={styles.text}>Flip Camera</Text>
          </TouchableOpacity>
        </View>
      </Camera>
      {capturedPhoto && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedPhoto }} style={styles.previewImage} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginBottom: 20,
  },
  button: {
    padding: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  text: {
    fontSize: 18,
    color: 'white',
  },
  previewContainer: {
    alignItems: 'center',
  },
  previewImage: {
    width: 200,
    height: 200,
    marginTop: 20,
  },
});

export default Blind;
