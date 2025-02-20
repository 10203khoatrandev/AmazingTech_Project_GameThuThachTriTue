import React, { useContext } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FloatingButtonContext } from './FloatingButtonContext';

const FloatingButton = () => {
  const navigation = useNavigation();
  const { createdRoom, setCreatedRoom } = useContext(FloatingButtonContext);

  if (!createdRoom) {
    return null;
  }

  const handlePress = () => {
    navigation.navigate('JoinRoom', { room: createdRoom });
  };

  return (
    <TouchableOpacity style={styles.floatingButton} onPress={handlePress}>
      <Text style={styles.floatingButtonText}>Rejoin</Text>
    </TouchableOpacity>
  );
};

export default FloatingButton;

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    top: 120,
    right: 0,
    backgroundColor: 'rgb(124, 186, 252)',
    padding: 8,
    borderBottomLeftRadius: 25,
    borderTopLeftRadius: 25,
    elevation: 5,
  },
  floatingButtonText: {
    color: 'white',
    fontSize: 16,
  },
});