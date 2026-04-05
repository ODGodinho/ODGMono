export default void (async (): Promise<void> => {
    process.env = {
        ...process.env,
    };
})();
