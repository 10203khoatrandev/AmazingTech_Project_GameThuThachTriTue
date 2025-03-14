export default {
  "expo": {
    "scheme": "QuizApplication",
    "name": "QuizApplication",
    "slug": "QuizApplication",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/Images/icon.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/Images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "plugins": [
      "@react-native-google-signin/google-signin",
      [
        "expo-image-picker",
        {
          "photosPermission": "Cho phép ứng dụng truy cập vào thư viện ảnh để thay đổi ảnh đại diện",
          "cameraPermission": "Cho phép ứng dụng sử dụng máy ảnh để chụp ảnh đại diện"
        }
      ]
    ],
    "ios": {
      "infoPlist": {
        "NSPhotoLibraryUsageDescription": "This app uses the photo library to allow users to select videos."
      },
      "supportsTablet": true,
      "bundleIdentifier": "com.khoatran10203.QuizApplication",
      "googleServicesFile": process.env.GOOGLE_SERVICES_INFOPLIST
    },
    "android": {
      "permissions": ["READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE", "CAMERA"],
      "adaptiveIcon": {
        "foregroundImage": "./assets/Images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.khoatran10203.QuizApplication",
      "googleServicesFile": process.env.GOOGLE_SERVICES_JSON
    },
    "web": {
      "favicon": "./assets/Images/favicon.png",
      "bundleIdentifier": "com.khoatran10203.QuizApplication"
    },
    "extra": {
      "eas": {
        "projectId": "077ca794-739d-4ef4-97e1-a27e1f423655"
      }
    }
  }
}
