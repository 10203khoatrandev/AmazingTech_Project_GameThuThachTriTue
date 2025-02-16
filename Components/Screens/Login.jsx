import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState } from "react";
import Custominput from "../custom/Custominput";
import ButtonCustom from "../custom/ButtonCustom";
import Thanhngang from "../custom/Thanhngang";
import { Alert } from "react-native";
import Custminputpass from "../custom/Custminputpass";
import Icon from "react-native-vector-icons/Ionicons";

const Login = (navigation) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const onLogin = () => {
    console.log("DangNhap ");
    navigation.navigate(Home);
  };
  const [isChecked, setIsChecked] = useState(false);
  const [isEntry, setIsEntry] = useState(true);
  const onPress = () => {
    setIsChecked(!isChecked);
    Alert.alert("thông báo", "nhấn thành công");
  };
  return (
    <View style={{ backgroundColor: "white", flex: 1 }}>
      <Image
        source={require("../Images/logo qizz.jpg")}
        style={styles.img}
        onPress={() => Alert.alert("", "aaa")}
      />

      <View style={styles.container}>
        <View style={{ width: "100%" }}>
          <Custominput
            IconName={"email"}
            placeholder={"Nhập email hoặc số điện thoại"}
            onChangeText={(text) => setEmail(text)}
          ></Custominput>
          <Custminputpass
            IconName={"password"}
            placeholder={"Password"}
            onPress={() => {
              setIsEntry(!isEntry);
            }}
            onChangeText={(text) => setPassword(text)}
            entry={isEntry}
          ></Custminputpass>
        </View>
        <View
          style={{
            flexDirection: "row",
            width: "100%",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text>Quyên Mật Khẩu ? </Text>
        </View>
        <ButtonCustom title={"Đăng nhập"} onPress={onLogin}></ButtonCustom>
        <Thanhngang title={"hoặc"}></Thanhngang>
        <View
          style={{
            width: 120,
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <TouchableOpacity>
            <Image source={require("../Images/logoGoogle.png")}></Image>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => console.log(email + " : " + password)}
          >
            <Image source={require("../Images/logoFb.png")} />
          </TouchableOpacity>
        </View>
        <View
          style={{ flexDirection: "row", alignItems: "center", marginTop: 20 }}
        >
          <Text>Bạn Không có tài khoản</Text>
          <Text
            style={styles.text}
            onPress={() => navigation.navigate("Dangky")}
          >
            Tạo tài khoản
          </Text>
        </View>
      </View>
    </View>
  );
};

export default Login;

const styles = StyleSheet.create({
  img: { width: "100%", height: 300, borderBottomRightRadius: 200 ,marginTop:50},
  container: { alignItems: "center", padding: 20 },
  text: {
    marginLeft: 10,
    color: "#009245",
  },
});
