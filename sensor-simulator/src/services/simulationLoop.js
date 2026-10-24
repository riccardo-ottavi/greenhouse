
export async function runSimulationCycle({
    runSimulation,
    getSimulationTime,
    advanceSimulationClock,
    logger = console
}) {
    const simulationTime = getSimulationTime();

    try {
        await runSimulation(simulationTime);
    } catch (error) {
        logger.error(
            "Simulation cycle error:",
            error.message
        );

        return;
    }

    await advanceSimulationClock();
}
