router.post("/recent/add", auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { songId } = req.body;

        const user = await User.findById(userId);

        // Remove duplicate
        user.recentPlayed = user.recentPlayed.filter(
            id => id.toString() !== songId
        );

        // Add on top
        user.recentPlayed.unshift(songId);

        // Keep only 10 max
        if (user.recentPlayed.length > 10) {
            user.recentPlayed = user.recentPlayed.slice(0, 10);
        }

        await user.save();

        res.json({ success: true });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
});
