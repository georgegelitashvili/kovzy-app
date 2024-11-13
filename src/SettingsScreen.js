// screens/SettingsScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
    StyleSheet,
    SafeAreaView,
    View,
    ScrollView,
    Text,
    TouchableOpacity,
    Switch,
    Image,
    Modal,
} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TouchableRipple } from 'react-native-paper'; // Corrected import
import { String, LanguageContext } from "./components/Language";
import { AuthContext, AuthProvider } from "./context/AuthProvider";
import axiosInstance from "./apiConfig/apiRequests";

// import { Drawer, Text, TouchableRipple, Switch } from "react-native-paper";


const SettingsScreen = ({ navigation }) => {
    const { domain, setDeliveronEnabled, deliveronEnabled } = useContext(AuthContext);
    const { dictionary } = useContext(LanguageContext);
    
    const [form, setForm] = useState({
        darkMode: false,
        emailNotifications: true,
        pushNotifications: false,
    });
    const [musicTitle, setMusicTitle] = useState(''); // State for music title
    
    const [modalVisible, setModalVisible] = useState(false);
    const [options, setOptions] = useState({
        url_deliveronStatus: "",
        url_deliveronActivity: "",
    });

    const [optionsIsLoaded, setOptionsIsLoaded] = useState(false); 
    const [deliveronChangeOptions, setDeliveronChangeOptions] = useState({});
    // Function to load the music title from AsyncStorage
    const loadMusicTitle = async () => {
        try {
            const title = await AsyncStorage.getItem('selectedMusicTitle');
            if (title) {
                setMusicTitle(title);
            } else {
                setMusicTitle('Plucky');
            }
        } catch (error) {
            console.log('Error loading music title:', error);
        }
    };
    const [isDeliveronEnabled, setIsDeliveronEnabled] = useState(false);
    const apiOptions = () => {
        setOptions({
          url_deliveronStatus: `https://${domain}/api/v1/admin/deliveronStatus`,
          url_deliveronActivity: `https://${domain}/api/v1/admin/deliveronActivity`,
        });
        setOptionsIsLoaded(true);
      };
      const toggleDeliveron = () => {
        if (deliveronEnabled == true) {
            setModalVisible(true);
        } else {
            handleConfirmToggle(true);
        }
    };

    const handleConfirmToggle = async (newValue) => {
        setModalVisible(false);
        setDeliveronEnabled(newValue); 
        setDeliveronChangeOptions((prev) => ({
            ...prev,
            data: { enabled: newValue ? 0 : 1 },
        }));
        try {
            await axiosInstance.post(options.url_deliveronActivity, deliveronChangeOptions.data);
        } catch (error) {
            console.error("Error toggling deliveron:", error);
            setDeliveronEnabled(!newValue);
        }
    };


    // Fetch the music title when the screen mounts
    useEffect(() => {
        loadMusicTitle();

        // Optional: Add a listener for focus event to reload the title when screen is focused
        const unsubscribe = navigation.addListener('focus', () => {
            loadMusicTitle();
        });

        // Clean up the listener on unmount
        return unsubscribe;
    }, [navigation]);

    useEffect(() => {
        if (domain) {
          apiOptions();
        }
      }, [domain]);

    useEffect(() => {
        setDeliveronChangeOptions((prev) => ({
          ...prev,
          data: { enabled: deliveronEnabled ? 0 : 1 },
        }));
        setIsDeliveronEnabled(true);
    }, [deliveronEnabled]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f6f6' }}>
            <View style={styles.container}>
                <ScrollView>
                    {/* <View style={styles.profile}>
                        <Image
                            alt=""
                            source={{
                                uri: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=2.5&w=256&h=256&q=80',
                            }}
                            style={styles.profileAvatar} />

                        <Text style={styles.profileName}>John Doe</Text>

                        <Text style={styles.profileEmail}>john.doe@mail.com</Text>

                        <TouchableOpacity
                            onPress={() => {
                                // handle onPress
                            }}>
                            <View style={styles.profileAction}>
                                <Text style={styles.profileActionText}>Edit Profile</Text>

                                <FeatherIcon color="#fff" name="edit" size={16} />
                            </View>
                        </TouchableOpacity>
                    </View> */}

                    <View style={styles.section}>
                        {/* დროებით დაკომენტარებული შეიძლება სამომავლოდ გამოდგეს */}
                        {/* <Text style={styles.sectionTitle}>Preferences</Text>

                        <View style={styles.sectionBody}>
                            <View style={[styles.rowWrapper, styles.rowFirst]}>
                                <TouchableOpacity
                                    onPress={() => {
                                        // handle onPress
                                    }}
                                    style={styles.row}>
                                    <View
                                        style={[styles.rowIcon, { backgroundColor: '#fe9400' }]}>
                                        <FeatherIcon
                                            color="#fff"
                                            name="globe"
                                            size={20} />
                                    </View>

                                    <Text style={styles.rowLabel}>Language</Text>

                                    <View style={styles.rowSpacer} />

                                    <Text style={styles.rowValue}>English</Text>

                                    <FeatherIcon
                                        color="#C6C6C6"
                                        name="chevron-right"
                                        size={20} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.rowWrapper}>
                                <View style={styles.row}>
                                    <View
                                        style={[styles.rowIcon, { backgroundColor: '#007AFF' }]}>
                                        <FeatherIcon
                                            color="#fff"
                                            name="moon"
                                            size={20} />
                                    </View>

                                    <Text style={styles.rowLabel}>Dark Mode</Text>

                                    <View style={styles.rowSpacer} />

                                    <Switch
                                        onValueChange={darkMode => setForm({ ...form, darkMode })}
                                        value={form.darkMode} />
                                </View>
                            </View>

                            <View style={styles.rowWrapper}>
                                <TouchableOpacity
                                    onPress={() => {
                                        // handle onPress
                                    }}
                                    style={styles.row}>
                                    <View
                                        style={[styles.rowIcon, { backgroundColor: '#32c759' }]}>
                                        <FeatherIcon
                                            color="#fff"
                                            name="navigation"
                                            size={20} />
                                    </View>

                                    <Text style={styles.rowLabel}>Location</Text>

                                    <View style={styles.rowSpacer} />

                                    <Text style={styles.rowValue}>Los Angeles, CA</Text>

                                    <FeatherIcon
                                        color="#C6C6C6"
                                        name="chevron-right"
                                        size={20} />
                                </TouchableOpacity>
                            </View>
                        </View> */}

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Notifications</Text>

                            <View style={styles.sectionBody}>
                                {/* <View style={[styles.rowWrapper, styles.rowFirst]}>
                                    <View style={styles.row}>
                                        <View
                                            style={[styles.rowIcon, { backgroundColor: '#38C959' }]}>
                                            <FeatherIcon
                                                color="#fff"
                                                name="at-sign"
                                                size={20} />
                                        </View>

                                        <Text style={styles.rowLabel}>Email Notifications</Text>

                                        <View style={styles.rowSpacer} />

                                        <Switch
                                            onValueChange={emailNotifications =>
                                                setForm({ ...form, emailNotifications })
                                            }
                                            value={form.emailNotifications} />
                                    </View>
                                </View>

                                <View style={styles.rowWrapper}>
                                    <View style={styles.row}>
                                        <View
                                            style={[styles.rowIcon, { backgroundColor: '#38C959' }]}>
                                            <FeatherIcon
                                                color="#fff"
                                                name="bell"
                                                size={20} />
                                        </View>

                                        <Text style={styles.rowLabel}>Push Notifications</Text>

                                        <View style={styles.rowSpacer} />

                                        <Switch
                                            onValueChange={pushNotifications =>
                                                setForm({ ...form, pushNotifications })
                                            }
                                            value={form.pushNotifications} />
                                    </View>
                                </View> */}

                                <View style={styles.rowWrapper}>
                                    <TouchableOpacity
                                        onPress={() => navigation.navigate('MusicList')}
                                        style={styles.row}>
                                        <View
                                            style={[styles.rowIcon, { backgroundColor: '#FE3C30' }]}>
                                            <FeatherIcon
                                                color="#fff"
                                                name="music"
                                                size={20} />
                                        </View>

                                        <Text style={styles.rowLabel}>Sound</Text>

                                        <View style={styles.rowSpacer} />

                                        <Text style={styles.rowValue}>{musicTitle}</Text>

                                        <FeatherIcon
                                            color="#C6C6C6"
                                            name="chevron-right"
                                            size={20} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                        <View style={[styles.section, styles.sectionContainer]}>
                            <TouchableRipple onPress={toggleDeliveron}>
                                <View style={[styles.row, styles.rowWrapper]}>
                                    <Text style={styles.rowLabel}>{dictionary["dv.deliveron"]}</Text>
                                    <Switch
                                        style={styles.switch}
                                        value={deliveronEnabled}
                                        onValueChange={toggleDeliveron}
                                    />
                                </View>
                            </TouchableRipple>
                        </View>
                        <Modal
                            transparent={true}
                            animationType="slide"
                            visible={modalVisible}
                            onRequestClose={() => setModalVisible(false)}
                        >
 <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.textContainer}>
                    <Text style={styles.modalText}>
                        {dictionary["dv.deliveronOff"]}
                    </Text>
                </View>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setModalVisible(false)}
                    >
                        <Text style={styles.buttonText}>{dictionary['cancel']}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={() => handleConfirmToggle(!deliveronEnabled)}
                    >
                        <Text style={styles.buttonText}>{dictionary['confirm']}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
                        </Modal>
                    </View>

                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    sectionContainer: {
        padding: 20,
        paddingBottom: 1,
        paddingTop: 1,
        paddingEnd: 1,
        marginVertical: 10,
        backgroundColor: '#fff',  
        borderRadius: 8,          
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,           
    },
    container: {
        paddingVertical: 24,
        paddingHorizontal: 0,
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: 0,
    },
    contentFooter: {
        marginTop: 24,
        fontSize: 13,
        fontWeight: '500',
        color: '#929292',
        textAlign: 'center',
    },
    /** Header */
    header: {
        paddingHorizontal: 24,
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: '#1d1d1d',
    },
    headerSubtitle: {
        fontSize: 15,
        fontWeight: '500',
        color: '#929292',
        marginTop: 6,
    },
    /** Profile */
    profile: {
        padding: 16,
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#e3e3e3',
    },
    profileAvatar: {
        width: 60,
        height: 60,
        borderRadius: 9999,
    },
    profileName: {
        marginTop: 12,
        fontSize: 20,
        fontWeight: '600',
        color: '#090909',
    },
    profileEmail: {
        marginTop: 6,
        fontSize: 16,
        fontWeight: '400',
        color: '#848484',
    },
    profileAction: {
        marginTop: 12,
        paddingVertical: 10,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#007bff',
        borderRadius: 12,
    },
    profileActionText: {
        marginRight: 8,
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    /** Section */
    section: {
        paddingTop: 12,
    },
    sectionTitle: {
        marginVertical: 8,
        marginHorizontal: 24,
        fontSize: 14,
        fontWeight: '600',
        color: '#a7a7a7',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    sectionBody: {
        paddingLeft: 24,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#e3e3e3',
    },
    /** Row */
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingRight: 16,
        height: 50,
    },
    rowWrapper: {
        borderTopWidth: 1,
        borderColor: '#e3e3e3',
    },
    rowFirst: {
        borderTopWidth: 0,
    },
    rowIcon: {
        width: 30,
        height: 30,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    rowLabel: {
        fontSize: 17,
        fontWeight: '500',
        color: '#000',
    },
    rowSpacer: {
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: 0,
    },
    rowValue: {
        fontSize: 17,
        fontWeight: '500',
        color: '#8B8B8B',
        marginRight: 4,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    },
    modalContent: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        elevation: 5,
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    textContainer: {
        alignSelf: 'flex-start',
        marginBottom: 15,
    },
    modalText: {
        marginBottom: 25,
        marginTop: 10,
        fontSize: 18,
        color: 'rgb(255, 0, 0)',
        fontWeight: 'bold',
        textAlign: 'justify',
        maxWidth: '100%',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cancelButton: {
        flex: 1,
        padding: 10,
        backgroundColor: '#ccc',
        borderRadius: 5,
        alignItems: 'center',
        marginRight: 10,
    },
    confirmButton: {
        flex: 1,
        padding: 10,
        backgroundColor: '#FCA510',
        borderRadius: 5,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default SettingsScreen;
