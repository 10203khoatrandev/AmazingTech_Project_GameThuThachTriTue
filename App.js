import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import LeaderBoard from './Components/Screens/LeaderBoard';
import Home from './Components/Screens/Home';
import QAmonitor from './Components/Screens/QAmonitor';
import Result from './Components/Screens/Result';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="QAmonitor" component={QAmonitor} />
        <Stack.Screen name="Result" component={Result} />
        <Stack.Screen name="LeaderBoard" component={LeaderBoard} /> 
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
});
