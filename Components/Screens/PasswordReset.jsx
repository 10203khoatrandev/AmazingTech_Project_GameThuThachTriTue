import { Image, StyleSheet, Text, TouchableOpacity, View, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import React, { useState } from "react";
import Custominput from "../custom/Custominput";
import ButtonCustom from "../custom/ButtonCustom";
import { Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { auth } from "../config";
import Toast from "react-native-toast-message";

const PasswordReset = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidEmail = (email) => {
    const re = /^[^@]+@[^@]+\.[^@]+$/;
    return re.test(email);
  };

  const showToast = (type, text1, text2) => {
    Toast.show({
      type: type, // 'success', 'error', 'info'
      position: 'top',
      text1: text1,
      text2: text2,
      visibilityTime: 3000,
      autoHide: true,
    });
  };

  const resetPassword = async (email) => {
    if (!email.trim()) {
      showToast('error', 'Thông báo', 'Email không được để trống');
      return;
    }
    
    if (!isValidEmail(email)) {
      showToast('error', 'Thông báo', 'Email không đúng định dạng');
      return;
    }
    
    setLoading(true);
    
    try {
      await auth.sendPasswordResetEmail(email);
      showToast('success', 'Thành công', 'Mã xác nhận đã gửi đến email của bạn');
      navigation.navigate("Login");
    } catch (error) {
      console.error(error);
      // Hiển thị thông báo lỗi cụ thể dựa trên mã lỗi của Firebase
      let errorMessage = 'Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Không tìm thấy tài khoản với email này.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email không hợp lệ.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Quá nhiều yêu cầu. Vui lòng thử lại sau.';
      }
      
      showToast('error', 'Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <Image
              source={require("../Images/logoquiz.png")}
              style={styles.img}
              resizeMode="contain"
            />
          </View>
          
          <View style={styles.formContainer}>
            <Text style={styles.title}>Đặt lại mật khẩu</Text>
            
            <Custominput
              IconName="email"
              placeholder="Nhập email"
              value={email}
              onChangeText={(text) => setEmail(text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <View style={styles.linkContainer}>
              <TouchableOpacity 
                onPress={() => navigation.navigate("Login")}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              >
                <Text style={styles.linkText}>Bạn nhớ mật khẩu?</Text>
              </TouchableOpacity>
            </View>
            
            <ButtonCustom
              title="Gửi Email"
              onPress={() => resetPassword(email)}
              loading={loading}
              disabled={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PasswordReset;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 10 : 30,
  },
  img: {
    width: '80%',
    height: 200,
    maxWidth: 300,
  },
  formContainer: {
    padding: 20,
    width: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#009245',
    textAlign: 'center',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    width: '100%',
    marginVertical: 15,
  },
  linkText: {
    color: '#009245',
    fontSize: 14,
  },
});