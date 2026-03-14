import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Pressable, TextInput,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { useApp } from '../../store/AppContext';
import Card from '../../components/ui/Card';
import AnimatedBackground from '../../components/ui/AnimatedBackground';
import Toast from 'react-native-toast-message';
import { getTodayString, getLocalDateString } from '../../services/cache';

function toLocalIso(date: string, time: string): string {
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    return new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0, 0, 0).toISOString();
}

export default function VitalsLogScreen({ navigation }: any) {
    const { logSteps, logSleep, logWeight, todayStepsLogs, todaySleepLogs, user } = useApp();

    const [steps, setSteps] = useState('');
    const [sleepStart, setSleepStart] = useState('22:00');
    const [sleepEnd, setSleepEnd] = useState('06:00');
    const [weight, setWeight] = useState(user?.current_weight_kg?.toString() || '');

    const handleLogSteps = async () => {
        const s = parseInt(steps);
        if (!s) return;
        try {
            await logSteps(s);
            Toast.show({ type: 'success', text1: 'Steps Recorded', text2: `${s.toLocaleString()} steps added.` });
            setSteps('');
        } catch (e) {
            console.warn(e);
        }
    };

    const handleLogSleep = async () => {
        const today = getTodayString();
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterday = getLocalDateString(yesterdayDate);

        // Simple mock: assume sleep was yesterday night, wake was today morning
        const sleepAt = toLocalIso(yesterday, sleepStart);
        const wakeAt = toLocalIso(today, sleepEnd);

        try {
            await logSleep(sleepAt, wakeAt);
            Toast.show({ type: 'success', text1: 'Sleep Recorded', text2: 'Rest well!' });
        } catch (e) {
            console.warn(e);
        }
    };

    const handleLogWeight = async () => {
        const w = parseFloat(weight);
        if (!w) return;
        try {
            await logWeight(w);
            Toast.show({ type: 'success', text1: 'Weight Updated', text2: `${w} kg.` });
        } catch (e) {
            console.warn(e);
        }
    };

    const totalTodaySteps = todayStepsLogs.reduce((acc, l) => acc + l.steps, 0);

    return (
        <View style={styles.container}>
            <AnimatedBackground />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </Pressable>
                    <Text style={styles.title}>Vitals & Daily</Text>
                </View>

                {/* --- STEPS --- */}
                <Card style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="footsteps" size={20} color={theme.colors.accentEmerald} />
                        <Text style={styles.cardTitle}>Daily Steps</Text>
                        <Text style={styles.cardValue}>{totalTodaySteps.toLocaleString()}</Text>
                    </View>
                    <View style={styles.inputRow}>
                        <TextInput
                            style={styles.input}
                            placeholder="Add steps..."
                            placeholderTextColor={theme.colors.textTertiary}
                            value={steps}
                            onChangeText={setSteps}
                            keyboardType="numeric"
                        />
                        <Pressable style={styles.addBtn} onPress={handleLogSteps}>
                            <Ionicons name="add" size={24} color="#000" />
                        </Pressable>
                    </View>
                </Card>

                {/* --- SLEEP --- */}
                <Card style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="moon" size={20} color={theme.colors.accentPurple} />
                        <Text style={styles.cardTitle}>Sleep Cycle</Text>
                    </View>
                    <View style={styles.sleepRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Slept at</Text>
                            <TextInput
                                style={styles.input}
                                value={sleepStart}
                                onChangeText={setSleepStart}
                                placeholder="22:00"
                                placeholderTextColor={theme.colors.textTertiary}
                            />
                        </View>
                        <View style={{ width: 20 }} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Woke at</Text>
                            <TextInput
                                style={styles.input}
                                value={sleepEnd}
                                onChangeText={setSleepEnd}
                                placeholder="06:00"
                                placeholderTextColor={theme.colors.textTertiary}
                            />
                        </View>
                    </View>
                    <Pressable style={[styles.mainBtn, { backgroundColor: theme.colors.accentPurple }]} onPress={handleLogSleep}>
                        <Text style={styles.mainBtnText}>Update Sleep</Text>
                    </Pressable>
                </Card>

                {/* --- WEIGHT --- */}
                <Card style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="scale" size={20} color={theme.colors.accentIndigo} />
                        <Text style={styles.cardTitle}>Morning Weight</Text>
                        <Text style={styles.cardValue}>{user?.current_weight_kg} kg</Text>
                    </View>
                    <View style={styles.inputRow}>
                        <TextInput
                            style={styles.input}
                            placeholder="Weight in kg"
                            placeholderTextColor={theme.colors.textTertiary}
                            value={weight}
                            onChangeText={setWeight}
                            keyboardType="decimal-pad"
                        />
                        <Pressable style={[styles.addBtn, { backgroundColor: theme.colors.accentIndigo }]} onPress={handleLogWeight}>
                            <Ionicons name="checkmark" size={24} color="#fff" />
                        </Pressable>
                    </View>
                </Card>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    title: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '800',
    },
    card: {
        padding: 20,
        marginBottom: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    cardTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 12,
        flex: 1,
    },
    cardValue: {
        color: theme.colors.textPrimary,
        fontSize: 18,
        fontWeight: '800',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 16,
        color: '#fff',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    addBtn: {
        width: 56,
        height: 56,
        borderRadius: 12,
        backgroundColor: theme.colors.accentEmerald,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
    label: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
    },
    sleepRow: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    mainBtn: {
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    mainBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
