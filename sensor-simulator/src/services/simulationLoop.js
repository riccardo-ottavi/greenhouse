export async function runSimulationCycle({
    runSimulation,
    getSimulationTime,
    advanceSimulationClock,
    getLastElapsedSimulatedMs = () => 0,
    logger = console
}) {
    const simulationTime = getSimulationTime();
    const elapsedSimulatedMs =
        getLastElapsedSimulatedMs();

    try {
        await runSimulation(
            simulationTime,
            elapsedSimulatedMs
        );
    } catch (error) {
        logger.error(
            "Simulation cycle error:",
            error.message
        );

        return;
    }

    await advanceSimulationClock(
        elapsedSimulatedMs
    );
}