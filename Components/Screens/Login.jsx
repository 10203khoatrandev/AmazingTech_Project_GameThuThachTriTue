import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import Custominput from "../custom/Custominput";
import ButtonCustom from "../custom/ButtonCustom";
import Thanhngang from "../custom/Thanhngang";
import { Alert } from "react-native";
import Custminputpass from "../custom/Custminputpass";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { db } from "../config";
import { collection, getDocs, query } from "firebase/firestore";
import crypto from "crypto-js";

const Login = ({ route }) => {
  const navigation = useNavigation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const [isEntry, setIsEntry] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    getUsers();
  }, [users]);

  const hashPassword = (password) => {
    return crypto.SHA256(password).toString();
  };

  const getUsers = async () => {
    try {
      const usersData = await getDocs(collection(db, "users"));
      setUsers(
        usersData.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }))
      );
    } catch (error) {
      console.log(error);
    }
  };

  const onPressTest = () => {
    console.log(users);
  };

  const onLogin = async (email, password) => {
    if (!email || !password) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ!");
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert("Lỗi", "Email không hợp lệ!");
      return;
    }
    const hashedPassword = hashPassword(password);

    const user = users.find(
      (user) => user.email === email && user.password === hashedPassword
    );

    if (user) {
      navigation.navigate("Home");
    } else {
      Alert.alert(
        "Thông",
        "Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại"
      );
    }
  };

  const isValidEmail = (email) => {
    const re = /^[^@]+@[^@]+\.[^@]+$/;
    return re.test(email);
  };

  const handleLogin = () => {
    onLogin(email, password);
  };

  const onpressConsole = () => {
    console.log(users);
  }

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
            onPress={() => console.log(users[1])}
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
