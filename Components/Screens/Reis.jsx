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
import Custminputpass2 from "../custom/Custminputpass2";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import Custminputpass from "../custom/Custminputpass";
import { auth, realtimeDb } from "../config";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";

const Reis = () => {
  const navigation = useNavigation();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const [isEntry, setIsEntry] = useState(true);

  const onRegister = async () => {
    if (!username || !email || !password || !retypePassword) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ!");
      return;
    }

    if (password !== retypePassword) {
      Alert.alert("Lỗi", "Mật khẩu không trùng khớp!");
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert("Lỗi", "Email không hợp lệ!");
      return;
    }

    try {
      // Tạo tài khoản người dùng với Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Lưu thông tin người dùng vào Realtime Database
      await set(ref(realtimeDb, `users/${user.uid}`), {
        username: username,
        email: email,
        password: password, 
        point: 100
      });

      console.log("User created with ID: ", user.uid);
      Alert.alert("Thành công", "Tài khoản đã được tạo thành công!");
      // Chuyển hướng người dùng hoặc thực hiện các hành động khác
      navigation.navigate("Login");
    } catch (error) {
      console.log("Error creating user: ", error);
      Alert.alert("Lỗi", "Đã có lỗi xảy ra khi tạo tài khoản. Vui lòng thử lại sau!");
    }
  };

  const isValidEmail = (email) => {
    const re = /^[^@]+@[^@]+\.[^@]+$/;
    return re.test(email);
  };

  return (
    <View style={{ backgroundColor: "white", flex: 1 }}>
      <Image
        source={require("../Images/logoquiz.png")}
        style={styles.img}
        onPress={() => Alert.alert("", "aaa")}
      />

      <View style={styles.container}>
        <View style={{ width: "100%" }}>
          <Custominput
            IconName={"person"}
            placeholder={"Tên tài khoản"}
            value={username}
            onChangeText={(text) => setUsername(text)}
          ></Custominput>
          <Custominput
            IconName={"email"}
            placeholder={"Nhập email"}
            value={email}
            onChangeText={(text) => setEmail(text)}
          ></Custominput>
          <Custminputpass2
            IconName={"password"}
            placeholder={"Nhập mật khẩu"}
            value={password}
            onChangeText={(text) => setPassword(text)}
            onPress={() => {
              setIsEntry(!isEntry);
            }}
            entry={isEntry}
          ></Custminputpass2>
          <Custminputpass2
            IconName={"password"}
            placeholder={"Nhập lại mật khẩu"}
            value={retypePassword}
            onChangeText={(text) => setRetypePassword(text)}
            onPress={() => {
              setIsEntry(!isEntry);
            }}
            entry={isEntry}
          ></Custminputpass2>
        </View>
        <ButtonCustom title={"Đăng ký"} onPress={onRegister}></ButtonCustom>
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
          <Text>Bạn đã có tài khoản?</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.text}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default Reis;

const styles = StyleSheet.create({
  img: {
    width: "90%",
    height: 300,
    borderBottomRightRadius: 200,
    marginTop: 70,
    marginBottom: 20,
    justifyContent: "center",
    alignSelf: "center",
  },
  container: { alignItems: "center", padding: 20 },
  text: {
    fontSize: 15,
    fontWeight: "bold",
    marginLeft: 10,
    color: "#009245",
  },
});
