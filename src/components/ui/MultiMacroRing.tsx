import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
    useSharedValue, useAnimatedProps, withTiming,
    Easing,
} from 'react-native-reanimated';
import { theme } from '../../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface MacroProgress {
    progress: number;
    color: string;
    label: string;
    value: string;
}

interface Props {
    size?: number;
    macros: MacroProgress[];
    centerLabel?: string;
    centerValue?: string;
}

export default function MultiMacroRing({
    size = 220, macros, centerLabel, centerValue,
}: Props) {
    return (
        <View style={styles.container}>
            <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
                {macros.map((m, i) => {
                    const strokeWidth = 12;
                    const spacing = 6;
                    const radius = (size / 2) - (i * (strokeWidth + spacing)) - (strokeWidth / 2);
                    const circumference = 2 * Math.PI * radius;

                    return (
                        <React.Fragment key={m.label}>
                            <Circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                stroke="rgba(255,255,255,0.05)"
                                strokeWidth={strokeWidth}
                                fill="none"
                            />
                            <Ring
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                progress={m.progress}
                                color={m.color}
                                strokeWidth={strokeWidth}
                                circumference={circumference}
                            />
                        </React.Fragment>
                    );
                })}
            </Svg>
            <View style={[styles.content, { width: size, height: size }]}>
                <Text style={styles.centerValue}>{centerValue}</Text>
                <Text style={styles.centerLabel}>{centerLabel}</Text>
            </View>
        </View>
    );
}

function Ring({ cx, cy, r, progress, color, strokeWidth, circumference }: any) {
    const animProgress = useSharedValue(0);

    useEffect(() => {
        animProgress.value = withTiming(Math.min(Math.max(progress, 0), 1), {
            duration: 1200,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
    }, [progress]);

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: circumference * (1 - animProgress.value),
    }));

    return (
        <AnimatedCircle
            cx={cx}
            cy={cy}
            r={r}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round"
        />
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerValue: {
        color: '#fff',
        fontSize: 38,
        fontWeight: '800',
        letterSpacing: -1,
    },
    centerLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginTop: -2,
    },
});
