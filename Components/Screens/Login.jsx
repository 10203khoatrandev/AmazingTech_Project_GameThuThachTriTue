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
import { useNavigation } from "@react-navigation/native";
import { db } from "../config";
import { collection, getDocs, query } from "firebase/firestore";

const Login = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const [isEntry, setIsEntry] = useState(true);

  const onLogin = async (email, password) => {
    if (!email || !password) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ!");
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert("Lỗi", "Email không hợp lệ!");
      return;
    }

    // Truy vấn Firestore
    const q = query(collection(db, "users"), where("email", "==", email));

    try {
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert("Email không tồn tại.");
        return;
      }

      querySnapshot.forEach((doc) => {
        const user = doc.data();

        // So sánh mật khẩu
        if (user.password === password) {
          // Đăng nhập thành công, chuyển sang màn hình Home
          navigation.navigate("Home");
        } else {
          alert("Mật khẩu không đúng.");
        }
      });
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      alert("Đã có lỗi xảy ra. Vui lòng thử lại sau.");
    }
  };

  const isValidEmail = (email) => {
    const re = /^[^@]+@[^@]+\.[^@]+$/;
    return re.test(email);
  };

  const handleLogin = () => {
    onLogin(email, password);
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
            IconName={"email"}
            placeholder={"Nhập email"}
            value={email}
            onChangeText={(text) => setEmail(text)}
          ></Custominput>
          <Custminputpass
            IconName={"password"}
            placeholder={"Password"}
            onPress={() => {
              setIsEntry(!isEntry);
            }}
            value={password}
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
          <Text>Quên Mật Khẩu ? </Text>
        </View>
        <ButtonCustom title={"Đăng nhập"} onPress={handleLogin}></ButtonCustom>
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
          <Text>Bạn Không có tài khoản?</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Reis")}>
            <Text style={styles.text}>Tạo tài khoản</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default Login;

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
