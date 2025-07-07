import axios from "axios";
import dotenv from "dotenv";
import pino from "pino";

dotenv.config();
const logger = pino();

const STEAM_API_KEY = process.env.STEAM_API_KEY;
const STEAM_ACHIEVEMENTS_URL = process.env.STEAM_ACHIEVEMENTS_URL;
const STEAM_ALL_GAMES_URL = process.env.STEAM_ALL_GAMES_URL as string;    
const STEAM_RECENT_GAMES_URL = process.env.STEAM_RECENT_GAMES_URL;

export async function getAllPlayedGames(steamId: string) {
    try {
        if (!STEAM_ALL_GAMES_URL) {
            throw new Error("STEAM_ALL_GAMES_URL is not defined in environment variables.");
        }
        const response = await axios.get(STEAM_ALL_GAMES_URL, {
            params: {
                key: STEAM_API_KEY,
                steamid: steamId,
                include_played_free_games: true
            }
        });
        if (response.data.response && response.data.response.games) {
            // Filter out games with zero playtime
            return response.data.response.games.filter((game: any) => game.playtime_forever > 0);
        }
    }
    catch (e) {
        logger.error(e, 'Failed to fetch all played games from Steam API');
    }
}

export async function getRecentlyPlayedGames(steamId: string) {
    try {
        if (!STEAM_RECENT_GAMES_URL) {
            throw new Error("STEAM_RECENT_GAMES_URL is not defined in environment variables.")
        }
        const response = await axios.get(STEAM_RECENT_GAMES_URL,  {
            params: {
                key: STEAM_API_KEY,
                steamid: steamId
            }
        });
        if (response.data.response.total_count > 0) {
            return response.data.response.games;
        }
        return [];
    }
    catch (e) {
        logger.error(e, 'Failed to fetch recently played games from Steam API');
    }
}

export async function getAchievements(steamId: string, appId: string) {
    try {
        if (!STEAM_ACHIEVEMENTS_URL) {
            throw new Error("STEAM_ACHIEVEMENTS_URL is not defined in environment variables.")
        }
        try {
            const response = await axios.get(STEAM_ACHIEVEMENTS_URL, {
                params: {
                    key: STEAM_API_KEY,
                    steamid: steamId,
                    appid: appId,
                    l: 'en' // Language parameter gets name + description of achievements
                }});
            if (response.data.playerstats?.success && response.data.playerstats.achievements?.length > 0) {
                // Remove achievements that are not unlocked
                var unlockedAchevements = response.data.playerstats.achievements.filter((achievement: any) => achievement.achieved === 1);
                return unlockedAchevements.map((achievement: any) => ({
                    name: achievement.name,
                    description: achievement.description,
                    unlocktime: achievement.unlocktime,
                    gamename: response.data.playerstats.gameName
                }));
            }
            return []; // No achievements available for this appId
        }

        // Handle 400 Bad Request error specifically
        catch (e) {
            if (axios.isAxiosError(e) && e.response?.status === 400) {
                logger.info(`No stats available for appid ${appId}`);
                return []; // No achievements available for this appId
            }
            else {
                throw e;
            }
        }


    }
    catch (e) {
        logger.error(e, `Failed to fetch achievements from Steam API for appId ${appId}`);
    }
}