import { StyleSheet, Dimensions } from "react-native";
import { Text, View } from "react-native";
import Toast, { BaseToast, ErrorToast } from "react-native-toast-message";

// Lấy chiều rộng màn hình để điều chỉnh kích thước của Toast
const { width } = Dimensions.get('window');

const toastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{
        ...props.style,
        width: width * 0.9,  // Sử dụng 90% chiều rộng màn hình
        maxHeight: 120,      // Tăng chiều cao tối đa
        borderLeftColor: "#009245",
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
      }}
      text2Style={{
        fontSize: 16,
        color: "#555",
      }}
      text2NumberOfLines={3}  // Cho phép hiển thị tối đa 3 dòng cho text2
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={{
        ...props.style,
        width: width * 0.9,  // Sử dụng 90% chiều rộng màn hình
        maxHeight: 120,      // Tăng chiều cao tối đa
        borderLeftColor: "#FF3B30",
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
      }}
      text2Style={{
        fontSize: 16,
        color: "#555",
      }}
      text2NumberOfLines={3}  // Cho phép hiển thị tối đa 3 dòng cho text2
    />
  ),
  // Custom toast với thiết kế hoàn toàn tùy chỉnh
  customToast: ({ text1, text2, props }) => (
    <View style={styles.customToast}>
      <Text style={styles.customText1}>{text1}</Text>
      {text2 ? <Text style={styles.customText2}>{text2}</Text> : null}
    </View>
  ),
};

const styles = StyleSheet.create({
  customToast: {
    width: width * 0.9,
    padding: 15,
    backgroundColor: "white",
    borderRadius: 8,
    borderLeftWidth: 5,
    borderLeftColor: "#007AFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginTop: 40,
  },
  customText1: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  customText2: {
    fontSize: 16,
    color: "#555",
    lineHeight: 22,
  },
});

export default toastConfig;