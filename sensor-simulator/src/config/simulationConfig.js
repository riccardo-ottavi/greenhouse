const simulationConfig = {
    sensors: {
        temperature: {
            initialValue: 22,
            min: 10,
            max: 35,
            outsideInfluence: 0.10,
            fanEffect: {
                min: 0.12,
                max: 0.18
            },
            growLightEffect: {
                min: 0.02,
                max: 0.04
            },
            randomVariation: {
                min: -0.05,
                max: 0.05
            }
        },

        humidity: {
            initialValue: 65,
            min: 20,
            max: 95,
            outsideInfluence: 0.02,
            pumpEffect: {
                min: 0.80,
                max: 1.20
            },
            fanEffect: {
                min: 0.25,
                max: 0.35
            },
            growLightEffect: {
                min: 0.03,
                max: 0.07
            },
            randomVariation: {
                min: -0.05,
                max: 0.05
            }
        },

        soilMoisture: {
            initialValue: 45,
            min: 10,
            max: 90,
            pumpEffect: {
                min: 0.70,
                max: 0.90
            },
            naturalDrying: {
                min: -0.07,
                max: -0.03
            },
            growLightEffect: 0.02
        },

        light: {
            initialValue: 10000,
            min: 0,
            max: 60000,
            responseRate: 0.20,
            growLightEffect: 5000,
            randomVariation: {
                min: -50,
                max: 50
            },
            naturalLight: {
                night: {
                    startHour: 21,
                    endHour: 6,
                    value: 0
                },
                morning: {
                    startHour: 6,
                    endHour: 9,
                    startValue: 0,
                    endValue: 10000
                },
                lateMorning: {
                    startHour: 9,
                    endHour: 12,
                    startValue: 10000,
                    endValue: 25000
                },
                afternoon: {
                    startHour: 12,
                    endHour: 15,
                    startValue: 25000,
                    endValue: 20000
                },
                evening: {
                    startHour: 15,
                    endHour: 18,
                    startValue: 20000,
                    endValue: 5000
                },
                sunset: {
                    startHour: 18,
                    endHour: 21,
                    startValue: 5000,
                    endValue: 0
                }
            }
        }
    },

    automaticRules: {
        pump: {
            turnOnBelow: 30,
            turnOffAtOrAbove: 50
        },

        fan: {
            turnOnAbove: {
                temperature: 28,
                humidity: 75
            },
            turnOffBelow: {
                temperature: 25,
                humidity: 70
            }
        },

        growLight: {
            operatingWindow: {
                startHour: 6,
                endHour: 20
            },
            turnOnBelow: 10000,
            turnOffAtOrAbove: 15000
        }
    }
};

export default simulationConfig;