import React, { useState, useEffect, useRef } from "react";
import { SafeAreaView, StyleSheet, ActivityIndicator, Modal, Image, Dimensions } from "react-native";
import { Camera } from 'expo-camera';
import { RNFFmpeg, RNFFmpegConfig } from "react-native-ffmpeg";
//import Carousel from "react-native-snap-carousel";
import { Video } from 'expo-av';

import { View, Text, Button, Icon, Header, Left, Right, FooterTab } from "native-base";

import * as MediaLibrary from "expo-media-library";
//import * as ImagePicker from "expo-image-picker";
import RNFS from "react-native-fs";
import { useHistory } from "react-router-native";
// import { useDispatch, useSelector } from "react-redux";
// import { imageCurrentChoose } from "../slice/imageCurrentChoose";

function Camera__() {
  // const dispatch = useDispatch();
  const history = useHistory();

  const camRef = useRef<object | any>(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [librayPermission, setLibraryPermission] = useState<boolean | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [flash, setFlash] = useState(Camera.Constants.FlashMode.off);
  const [capturedPhoto, setCapturedPhoto] = useState<string | any>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [cancel, setCancel] = useState<boolean>(false);
  const [takingPicture, setTakingPicture] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [video, setVideo] = useState<string>();
  const [album, setAlbum] = useState<Array<MediaLibrary.Asset>>();
  //const [arrPictures, setArrPictures] = useState<Array<string>>([]);
  const [modeAuto, setModeAuto] = useState<boolean>(false);
  
  useEffect(() => {
    const getCameraPermission = async () => {
      const { status } = await Camera.requestPermissionsAsync();
      setCameraPermission(status === "granted");
    }
  
    const getLibraryPermission = async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setLibraryPermission(status === "granted");
    }

    getCameraPermission()
    getLibraryPermission()
    RNFFmpegConfig.disableLogs();
  }, []);

  

  if (cameraPermission === null || librayPermission === null) {
    return <View />;
  }
  if (cameraPermission === false || librayPermission === false) {
    return <Text>No permission</Text>;
  }

  const takePicture = async () => {
    if (!camRef) return
    const { uri } = await camRef.current.takePictureAsync()
    setOpen(true);
    setCapturedPhoto(uri);
    }

  const takePictureAuto = async() => {
    setTakingPicture(true)
    console.log("Begin take auto pics")
    var width = 0;
    setCancel(true);
    var id = setInterval(frame, 4000);
    const albumName = "ALBUM__" + new Date().getTime().toFixed();
    const albumUri = RNFS.ExternalDirectoryPath + '/Gallery/' + albumName
    let newAlbum: Array<MediaLibrary.Asset> = [];
    async function frame() {
      if (width == 0) {
        width++;
        if (camRef) {
          const { uri } = await camRef.current.takePictureAsync({skipProcessing: true});
          //setOpen(true);
          const asset = await MediaLibrary.createAssetAsync(uri)
          await RNFS.mkdir(albumUri)
          // StorageAccessFramework.copyAsync({ from: asset.uri, to: albumUri + '/image_00' + width + '.jpg'})
          await RNFS.copyFile(asset.uri, albumUri + '/image_001.jpg')
          //newAlbum.push(albumUri + '/image_001.jpg')
          newAlbum.push(asset)
      }}
      else {
        if (width == 48) {
          setCancel(false);
          clearInterval(id);
          console.log("End take auto pics")
          setAlbum([...newAlbum])
          const command = '-framerate 12 -i ' + albumUri + '/image_%03d.jpg -s 640x800 -b:v 1M -pix_fmt yuv420p ' + albumUri + '/out.mp4';
          await RNFFmpeg.execute(command)
          console.log("Finish encode video")
          setVideo(albumUri + '/out.mp4')
          setTakingPicture(false);
          alert("Finish encode video");
        } else {
          width++;
          if (camRef) {
            const { uri } = await camRef.current.takePictureAsync({skipProcessing: true});
            //setOpen(true);
            const asset = await MediaLibrary.createAssetAsync(uri)
            let assetName: string;
            if (width<10)
              assetName = '/image_00' + width + '.jpg';
            else
              assetName = '/image_0' + width + '.jpg';
            await RNFS.copyFile(asset.uri, albumUri + assetName)
            //newAlbum.push('file://' + albumUri + assetName)
            newAlbum.push(asset)
          }
        }
      }
    }
  }

  // const pickImage = async() => {
  //   let result = await ImagePicker.launchImageLibraryAsync({
  //     mediaTypes: ImagePicker.MediaTypeOptions.All,
  //     allowsEditing: true,
  //     aspect: [1, 1],
  //     quality: 1,
  //   });

  //   console.log(result);

  //   if (!result.cancelled) {
  //     // const action = imageCurrentChoose({ img: result.uri });
  //     // di spatch(action);
  //     // history.push({ pathname: "/home", state: result.uri });
  //   }
  // }

  const savePicture = async() => {
    await MediaLibrary.saveToLibraryAsync(capturedPhoto).then(() => setOpen(false))
      .catch((error: any) => {
        console.log("err", error);
      });
  }

  return (
    <SafeAreaView style={styles.container}>
      <Modal animationType="slide" visible={showModal}>
        <Header hasTabs>
          <Left>
            <Button transparent onPress={() => { 
                setShowModal(false)}}>
              <Text>Back</Text>
            </Button>
          </Left>
          <Right>
          </Right>
        </Header>
        {video ? (
          <View>
            <Text style={{alignSelf: "center", fontSize: 18, fontWeight: "bold"}}>Video</Text>
            <Video source={{uri: video}} style={{ alignSelf: "center", width: "100%", height: "75%", display: "flex"}} resizeMode="contain" shouldPlay={isPlaying} isLooping/>
            <Button style={{alignSelf: "center", marginTop: 10}} rounded onPress={() => setIsPlaying(!isPlaying)}>
              {!isPlaying ? (
                <Icon name="play" type="Ionicons"/>
              ) : (
                <Icon name="stop" type="Ionicons"/>
              )}
            </Button>
          </View>
        ) : (
          <Text>No video selected</Text>
        )}
        {/* {album ? (
          <Carousel
            data={album}
            renderItem={items => {
              const item = items.item
              return (
                  <Image source={{uri: 'file://' + item}} style={{width: "100%", height: "80%"}}/>
              )
            }}
            sliderWidth={Dimensions.get('window').width}
            itemWidth={Dimensions.get('window').width}
            loop={true}
            loopClonesPerSide={12}
            activeSlideOffset={50}
            lockScrollTimeoutDuration={200}
          />
          <Image360Viewer srcset={album} width={Dimensions.get("window").width} height={Dimensions.get('window').height/2}/>
        ) : (
          <Text>No album selected</Text>
        )} */}
      </Modal>
      <Header>
        <Left>
            <Button transparent vertical onPress={() => 
                setFlash(
                    flash === Camera.Constants.FlashMode.off
                        ? Camera.Constants.FlashMode.on
                        : Camera.Constants.FlashMode.off
                    )
                }
            >
            {flash === Camera.Constants.FlashMode.off && (
                <Icon name="flash-off" type="Ionicons"/>
            )}
            {flash === Camera.Constants.FlashMode.on && (
                <Icon name="flash" type="Ionicons"/>
            )}
                <Text>Flash</Text>
            </Button>
        </Left>
        <Right>
            <Button transparent vertical onPress={() => setModeAuto(!modeAuto)}>
              <Icon
                  name="camera-burst"
                  type="MaterialCommunityIcons"
              />
              <Text>Mode: {modeAuto ? ("Auto") : ("Normal")}</Text>
            </Button>
        </Right>
      </Header>

      <Camera
        style={{ flex: 0.9, alignItems: "center", justifyContent: "flex-end" }}
        type={type}
        ref={camRef}
        flashMode={flash}
      >
      </Camera>

      <FooterTab style={{flex: 0.1}}>
          <Button
            active
            onPress={() => {
              setType(
                type === Camera.Constants.Type.back
                  ? Camera.Constants.Type.front
                  : Camera.Constants.Type.back
              );
            }}
          >
            <Icon name="camera-reverse" type="Ionicons" />
          </Button>
          {modeAuto ? (
            <Button active onPress={takePictureAuto} disabled={takingPicture}>
              <Icon name="switch-camera" type="MaterialIcons"/>
            </Button>
          ) : (
            <Button active onPress={takePicture} disabled={takingPicture}>
              <Icon name="camera-alt" type="MaterialIcons"/>
            </Button>
          )}
          <Button active onPress={() => setShowModal(true)}>
            <Icon name="images" type="FontAwesome5" />
          </Button>
      </FooterTab>
      {capturedPhoto && (
        <Modal animationType="slide" transparent={false} visible={open}>
          <Header>
            <Left>
              <Button
                transparent
                onPress={() => setOpen(false)}
              >
                <Icon name="window-close" type="FontAwesome" />
              </Button>
            </Left>
            <Right>
              <Button
                transparent
                disabled={modeAuto}
                onPress={savePicture}
              >
                <Icon name="save" type="FontAwesome5" />
              </Button>
            </Right>
          </Header>

            <Image
              style={{ resizeMode: "cover", width: "100%", height: "90%" }}
              source={{ uri: capturedPhoto }}
            />
            {cancel && (
              <Modal animationType="fade" transparent={true} visible={cancel}>
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    margin: 20,
                  }}
                >
                  <Text style={{ color: "white" }}>Taking pictures...</Text>
                  <ActivityIndicator size="large" />
                  <Button
                    transparent
                    onPress={() => {
                      setCancel(false);
                    }}
                  >
                    <Text style={{ color: "white", fontSize: 30 }}>Cancel</Text>
                  </Button>
                </View>
              </Modal>
            )}
        </Modal>
      )}
    </SafeAreaView>
  );
}

export default Camera__;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
});
