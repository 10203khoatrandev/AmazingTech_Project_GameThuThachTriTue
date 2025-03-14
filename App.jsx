import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native";
import Toast from "react-native-toast-message";
import "react-native-gesture-handler";

// Providers
import { RoomsProvider } from "./Components/Component/RoomsContext";
import { FloatingButtonProvider } from "./Components/Component/FloatingButtonContext";

// Components
import FloatingButton from "./Components/Component/FloatingButton";
import toastConfig from "./Components/custom/toastConfig";

// Screens
import Home from "./Components/Screens/Home";
import LeaderBoard from "./Components/Screens/LeaderBoard";
import QAmonitor from "./Components/Screens/QAmonitor";
import Result from "./Components/Screens/Result";
import DetailAnswer from "./Components/Screens/DetailAnswer";
import Login from "./Components/Screens/Login";
import Reis from "./Components/Screens/Reis";
import ProfileScreen from "./Components/Screens/Profile";
import DiscoverScreen from "./Components/Screens/Discover";
import QuestionPicker from "./Components/Screens/QuestionPicker";
import PasswordReset from "./Components/Screens/PasswordReset";

// Components
import JoinRoom from "./Components/Component/JoinRoom";
import Room from "./Components/Component/Room";
import Friends from "./Components/Component/Friends";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Định nghĩa các biểu tượng và màu sắc cho các tab
const TAB_CONFIG = {
  Home: {
    icon: "home",
    label: "",
  },
  DiscoveryFrag: {
    icon: "rocket",
    label: "",
  },
  LeaderBoard: {
    icon: "podium",
    label: "",
  },
  ProfileScreen: {
    icon: "person",
    label: "",
  },
};

const TAB_COLORS = {
  active: "#6A5AE0",
  inactive: "#ccc",
};

// Stack navigation cho Home
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Home" component={Home} />
    <Stack.Screen name="QAmonitor" component={QAmonitor} />
    <Stack.Screen name="Result" component={Result} />
    <Stack.Screen name="DetailAnswer" component={DetailAnswer} />
    <Stack.Screen name="DiscoverScreen" component={DiscoverScreen} />
    <Stack.Screen name="Room" component={Room} />
    <Stack.Screen name="JoinRoom" component={JoinRoom} />
    <Stack.Screen name="Friends" component={Friends} />
  </Stack.Navigator>
);

// Stack navigation cho Discovery
const DiscoveryStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DiscoverScreen" component={DiscoverScreen} />
    <Stack.Screen name="Room" component={Room} />
    <Stack.Screen name="JoinRoom" component={JoinRoom} />
    <Stack.Screen name="QuestionPicker" component={QuestionPicker} />
    <Stack.Screen name="QAmonitor" component={QAmonitor} />
    <Stack.Screen name="Result" component={Result} />
    <Stack.Screen name="DetailAnswer" component={DetailAnswer} />
  </Stack.Navigator>
);

// Tab navigation
const AppTabs = () => (
  <Tab.Navigator
    initialRouteName="Home"
    screenOptions={{ headerShown: false }}
  >
    {Object.entries(TAB_CONFIG).map(([name, config]) => (
      <Tab.Screen
        key={name}
        name={name}
        component={name === "Home" ? HomeStack : name === "DiscoveryFrag" ? DiscoveryStack : 
                 name === "LeaderBoard" ? LeaderBoard : ProfileScreen}
        options={{
          tabBarLabel: config.label,
          tabBarActiveTintColor: TAB_COLORS.active,
          tabBarInactiveTintColor: TAB_COLORS.inactive,
          tabBarIcon: ({ color }) => (
            <Ionicons name={config.icon} size={28} color={color} />
          ),
        }}
      />
    ))}
  </Tab.Navigator>
);

// Root navigation
const AppNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={Login} />
    <Stack.Screen name="Reis" component={Reis} />
    <Stack.Screen name="PasswordReset" component={PasswordReset} />
    <Stack.Screen name="MyTabs" component={AppTabs} />
  </Stack.Navigator>
);

// Ứng dụng chính
export default function App() {
  return (
    <RoomsProvider>
      <FloatingButtonProvider>
        <NavigationContainer>
          <AppNavigator />
          <FloatingButton />
          <Toast config={toastConfig} />
        </NavigationContainer>
      </FloatingButtonProvider>
    </RoomsProvider>
  );
}