import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import LeaderBoard from "./Components/Screens/LeaderBoard";
import Home from "./Components/Screens/Home";
import QAmonitor from "./Components/Screens/QAmonitor";
import Result from "./Components/Screens/Result";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import DetailAnswer from "./Components/Screens/DetailAnswer";
import { Ionicons } from "@expo/vector-icons";
import Login from "./Components/Screens/Login";
import Reis from "./Components/Screens/Reis";
import ProfileScreen from "./Components/Screens/Profile";
import DiscoverScreen from "./Components/Screens/Discover";
import JoinRoom from "./Components/Component/JoinRoom";
import Room from "./Components/Component/Room";
import { RoomsProvider } from './Components/Component/RoomsContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MyTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarLabel: "",
          tabBarActiveTintColor: "#6A5AE0",
          tabBarInactiveTintColor: "#ccc",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={28} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="DiscoverScreen"
        component={DiscoverScreen}
        options={{
          tabBarLabel: "",
          tabBarActiveTintColor: "#6A5AE0",
          tabBarInactiveTintColor: "#ccc",
          tabBarIcon: ({ color }) => (
            <Ionicons name="rocket" size={28} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="LeaderBoard"
        component={LeaderBoard}
        options={{
          tabBarLabel: "",
          tabBarActiveTintColor: "#6A5AE0",
          tabBarInactiveTintColor: "#ccc",
          tabBarIcon: ({ color }) => (
            <Ionicons name="podium" size={28} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{
          tabBarLabel: "",
          tabBarActiveTintColor: "#6A5AE0",
          tabBarInactiveTintColor: "#ccc",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={28} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="QAmonitor" component={QAmonitor} />
      <Stack.Screen name="Result" component={Result} />
      <Stack.Screen name="DetailAnswer" component={DetailAnswer} />
      <Stack.Screen name="DiscoverScreen" component={DiscoverScreen} />
      <Stack.Screen name="JoinRoom" component={JoinRoom} />
      <Stack.Screen name="Room" component={Room} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <RoomsProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Reis" component={Reis} />
          <Stack.Screen name="MyTabs" component={MyTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </RoomsProvider>
  );
}

const styles = StyleSheet.create({});
