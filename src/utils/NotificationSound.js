import React, { useEffect, useContext, useRef, useImperativeHandle, forwardRef } from 'react';
import { View, AppState, Alert } from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageContext } from '../components/Language';
import * as Sentry from '@sentry/react-native';

const musicList = [
    { id: '1', title: 'Plucky', source: require('../assets/audio/plucky.mp3') },
    { id: '2', title: 'Order', source: require('../assets/audio/order.mp3') },
    { id: '3', title: 'Definite', source: require('../assets/audio/definite-555.mp3') },
    { id: '4', title: 'Joyous chime', source: require('../assets/audio/joyous-chime-notification.mp3') },
    { id: '5', title: 'Light hearted tone', source: require('../assets/audio/light-hearted-message-tone.mp3') },
    { id: '6', title: 'Notification pretty good', source: require('../assets/audio/notification-pretty-good.mp3') },
    { id: '7', title: 'Pristine', source: require('../assets/audio/pristine-609.mp3') },
    { id: '8', title: 'Relax tone', source: require('../assets/audio/relax-message-tone.mp3') },
];

const NotificationSound = forwardRef((props, ref) => {
    const { dictionary } = useContext(LanguageContext);
    const soundRef = useRef(null);
    const timeoutRef = useRef(null);
    const appState = useRef(AppState.currentState);
    const isSoundPlaying = useRef(false);
    const isAlertVisible = useRef(false);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                onStopPlaySound();
                isAlertVisible.current = false;
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
            onStopPlaySound();
        };
    }, []);

    const clearStopTimeout = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };

    const onStopPlaySound = async () => {
        try {
            clearStopTimeout();
            if (soundRef.current) {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
                soundRef.current = null;
            }
            isSoundPlaying.current = false;
            console.log('🔈 Notification sound stopped and unloaded');
        } catch (error) {
            isSoundPlaying.current = false;
            console.log('Audio stop error (suppressed):', error);
            Sentry.captureException(error);
        }
    };

    const onPlaySound = async (repeat = false, selectedSound = '1', volume = 1.0) => {
        try {
            if (isSoundPlaying.current) {
                console.log('🔈 Sound already playing, skipping new sound');
                return;
            }

            await onStopPlaySound();

            const music = musicList.find(m => m.id === selectedSound) || musicList[0];
            const { sound } = await Audio.Sound.createAsync(
                music.source,
                { volume, shouldPlay: true, isLooping: repeat }
            );

            soundRef.current = sound;
            isSoundPlaying.current = true;

            sound.setOnPlaybackStatusUpdate(status => {
                if (!status.isLoaded) {
                    return;
                }

                if (status.didJustFinish && !repeat) {
                    isSoundPlaying.current = false;
                    clearStopTimeout();
                    console.log('🔈 Sound playback finished naturally');
                }
            });

            // Non-looping sounds still get a safety timeout
            if (!repeat) {
                timeoutRef.current = setTimeout(async () => {
                    await onStopPlaySound();
                    console.log('🔈 Sound stopped due to timeout');
                }, 10000);
            }

            console.log('🔈 Playing notification sound:', music.title, repeat ? '(looping)' : '');
        } catch (error) {
            isSoundPlaying.current = false;
            console.log('Audio play error (suppressed):', error);
            Sentry.captureException(error);
        }
    };

    const loadAndPlaySavedMusic = async (forceRepeat = false) => {
        try {
            const savedMusicId = await AsyncStorage.getItem('selectedMusicId');
            const savedRepeat = (await AsyncStorage.getItem('repeatSound')) === 'true';
            const repeat = forceRepeat || savedRepeat;
            const volume = parseFloat(await AsyncStorage.getItem('soundVolume')) || 1.0;
            await onPlaySound(repeat, savedMusicId || '1', volume);
        } catch (error) {
            console.log('Error loading saved music:', error);
            Sentry.captureException(error);
            await onPlaySound(forceRepeat, '1', 1.0);
        }
    };

    const orderReceived = async () => {
        // Always loop until the alert is dismissed
        await loadAndPlaySavedMusic(true);

        if (isAlertVisible.current) {
            return;
        }

        isAlertVisible.current = true;
        Alert.alert(
            dictionary?.['general.alerts'] || 'შეტყობინება',
            dictionary?.['orders.orderReceivedTitle'] || 'ახალი შეკვეთა მიღებულია',
            [
                {
                    text: dictionary?.['okay'] || 'კარგი',
                    onPress: async () => {
                        isAlertVisible.current = false;
                        await onStopPlaySound();
                        console.log('🔈 Stopped sound on alert dismissal');
                    },
                },
            ],
            { cancelable: false }
        );
    };

    useImperativeHandle(ref, () => ({
        playSound: async (options = {}) => {
            const { repeat = false, selectedSound = '1', volume = 1.0 } = options;
            await onPlaySound(repeat, selectedSound, volume);
        },
        stopSound: async () => {
            await onStopPlaySound();
        },
        orderReceived,
    }));

    return <View />;
});

export default NotificationSound;
