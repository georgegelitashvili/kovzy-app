import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Platform } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { Audio } from 'expo-av';
import { Feather } from '@expo/vector-icons'; // Import Feather icons
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';


const musicList = [
    { id: '1', title: 'Plucky', source: require('../../assets/audio/plucky.mp3') },
    { id: '2', title: 'Order', source: require('../../assets/audio/order.mp3') },
    { id: '3', title: 'Definite', source: require('../../assets/audio/definite-555.mp3') },
    { id: '4', title: 'Joyous chime', source: require('../../assets/audio/joyous-chime-notification.mp3') },
    { id: '5', title: 'Light hearted tone', source: require('../../assets/audio/light-hearted-message-tone.mp3') },
    { id: '6', title: 'Notification pretty good', source: require('../../assets/audio/notification-pretty-good.mp3') },
    { id: '7', title: 'Pristine', source: require('../../assets/audio/pristine-609.mp3') },
    { id: '8', title: 'Relax tone', source: require('../../assets/audio/relax-message-tone.mp3') },
];

const NotificationScreen = ({ navigation }) => {
    const [sound, setSound] = useState(null);
    const [playingMusicId, setPlayingMusicId] = useState(null);
    const [selectedMusic, setSelectedMusic] = useState(null); // No default music initially
    const [pressedCardId, setPressedCardId] = useState(null); // State to track pressed card

    useEffect(() => {
        // Load saved music from AsyncStorage
        const loadSavedMusic = async () => {
            try {
                const savedMusicId = await AsyncStorage.getItem('selectedMusicId');
                if (savedMusicId) {
                    setSelectedMusic(savedMusicId);
                    setPlayingMusicId(savedMusicId);
                } else {
                    setSelectedMusic(1);
                    setPlayingMusicId(1);
                }
            } catch (error) {
                console.log('Error loading saved music:', error);
            }
        };
        loadSavedMusic();
    }, []);

    useFocusEffect(
        useCallback(() => {
            return () => {
                // Stop the music when the screen loses focus
                if (sound) {
                    sound.stopAsync();
                    setPlayingMusicId(null);
                }
            };
        }, [sound])
    );

    useEffect(() => {
        return sound
            ? () => {
                sound.unloadAsync(); // Cleanup sound resource
            }
            : undefined;
    }, [sound]);

    const onPlaySound = async (musicId, source) => {
        // Stop the current playing sound if it's different from the new one
        if (sound && playingMusicId !== musicId) {
            await sound.stopAsync();
            await sound.unloadAsync();
            setSound(null); // Reset the sound state
        }

        // If the music is already playing and it's the same one, stop it
        if (playingMusicId === musicId) {
            await sound.stopAsync();
            setPlayingMusicId(null);
            return;
        }

        // Load the new sound and play it
        const { sound: newSound } = await Audio.Sound.createAsync(source);
        setSound(newSound);
        setPlayingMusicId(musicId);

        try {
            await newSound.playAsync();
            // Add a listener to stop playing when the audio is done
            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.didJustFinish) {
                    setPlayingMusicId(null);
                }
            });
        } catch (error) {
            console.log('Error playing sound:', error);
        }
    };


    const onSelectMusic = async (id, title) => {
        // Toggle selection state of music only if it's not already selected
        setSelectedMusic((prevSelected) => (prevSelected === id ? prevSelected : id));

        // Save the selected music ID to AsyncStorage
        try {
            await AsyncStorage.setItem('selectedMusicId', id);
            // Save the selected music title to AsyncStorage
            await AsyncStorage.setItem('selectedMusicTitle', title);
        } catch (error) {
            console.log('Error saving selected music:', error);
        }
    };


    const handleCardPress = (item) => {
        // Select music
        onSelectMusic(item.id, item.title);
        // Play or stop sound based on current playback
        if (playingMusicId === item.id) {
            // If the same music is clicked, stop it
            onPlaySound(item.id, item.source);
        } else {
            // If a different music is clicked, stop the previous one and play the new one
            onPlaySound(item.id, item.source);
        }
    };


    const handleOutsidePress = () => {
        // Stop music when clicking outside the card
        if (sound) {
            sound.stopAsync();
            setPlayingMusicId(null);
        }
    };

    const handlePressIn = (id) => {
        setPressedCardId(id);
    };

    const handlePressOut = () => {
        setPressedCardId(null);
    };

    return (
        <TouchableWithoutFeedback onPress={handleOutsidePress}>
            <View style={styles.container}>
                <FlatList
                    data={musicList}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPressIn={() => handlePressIn(item.id)}
                            onPressOut={handlePressOut}
                            onPress={() => handleCardPress(item)}
                        >
                            <Card
                                style={[
                                    styles.card,
                                    pressedCardId === item.id ? styles.cardPressed : {}
                                ]}
                            >
                                <Card.Content style={styles.cardContent}>
                                    <View style={styles.titleContainer}>
                                        <Text style={styles.title}>{item.title}</Text>
                                        <TouchableOpacity style={styles.checkboxContainer}>
                                            {selectedMusic === item.id && (
                                                <Feather name="check" size={24} color="#007AFF" />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </Card.Content>
                            </Card>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.list}
                />
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5', // Light background color for a cleaner look
    },
    list: {
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    card: {
        marginBottom: 10, // Space between cards
        borderRadius: 8, // Rounded corners for each card
        elevation: 2, // Less intense shadow on Android
        shadowColor: '#000', // Shadow color
        shadowOffset: { width: 0, height: 1 }, // Shadow offset
        shadowOpacity: 0.1, // Less intense shadow
        shadowRadius: 2, // Less intense shadow blur
    },
    cardPressed: {
        elevation: 1, // Reduced shadow on press
        shadowOpacity: 0.05, // Even less intense shadow on press
    },
    cardContent: {
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center', // Align items vertically
        justifyContent: 'space-between', // Space between title and checkbox
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333333',
        flex: 1, // Allow title to take available space
    },
    checkboxContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        height: 24, // Ensure container has enough height to show the icon
        width: 24, // Ensure container has enough width to show the icon
    },
});

export default NotificationScreen;
