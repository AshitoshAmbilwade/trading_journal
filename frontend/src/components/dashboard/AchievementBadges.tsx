"use client";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Trophy, Star, Flame, Target, Zap, Award, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { gamificationApi, Gamification } from "../../api/gamification";
import { Skeleton } from "../ui/skeleton";

interface AchievementBadgesProps {
  userId: string;
}

export function AchievementBadges({ userId }: AchievementBadgesProps) {
  const [gamification, setGamification] = useState<Gamification | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGamification();
  }, [userId]);

  const loadGamification = async () => {
    try {
      setLoading(true);
      const data = await gamificationApi.getByUser(userId);
      setGamification(data);
    } catch (error) {
      console.error("Error loading gamification:", error);
    } finally {
      setLoading(false);
    }
  };

  const levelProgress = gamification ? (gamification.points % 1000) / 10 : 0;
  const nextLevelPoints = gamification ? 1000 - (gamification.points % 1000) : 1000;

  return (
    <Card className="border-border/50 bg-card/40 backdrop-blur-xl relative overflow-hidden group hover:border-yellow-500/30 transition-all">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-yellow-500/5 opacity-50 group-hover:opacity-100 transition-opacity" />
      <motion.div 
        className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 via-yellow-500 to-orange-600 flex items-center justify-center shadow-lg"
              whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
              transition={{ duration: 0.5 }}
            >
              <Trophy className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <CardTitle>Achievements</CardTitle>
              <CardDescription>Your trading milestones and streaks</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : gamification ? (
          <div className="space-y-6">
            {/* Level and Progress */}
            <div className="p-4 rounded-lg bg-background/50 border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium">Level {gamification.level}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {nextLevelPoints} points to next level
                </span>
              </div>
              <Progress value={levelProgress} className="h-2" />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">
                  {gamification.points.toLocaleString()} total points
                </span>
                <span className="text-xs text-muted-foreground">
                  {Math.floor(levelProgress)}%
                </span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-3 rounded-lg bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border border-orange-500/20 text-center"
              >
                <Flame className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                <p className="text-2xl mb-1">{gamification.currentStreak}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 text-center"
              >
                <Target className="h-6 w-6 mx-auto mb-2 text-green-500" />
                <p className="text-2xl mb-1">{gamification.longestStreak}</p>
                <p className="text-xs text-muted-foreground">Best Streak</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-3 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 text-center"
              >
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-cyan-500" />
                <p className="text-2xl mb-1">{gamification.totalTrades}</p>
                <p className="text-xs text-muted-foreground">Total Trades</p>
              </motion.div>
            </div>

            {/* Achievements */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                Recent Achievements
              </h4>
              <div className="space-y-2">
                {gamification.achievements.length > 0 ? (
                  gamification.achievements.slice(0, 3).map((achievement, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-3 rounded-lg bg-background/50 border border-border flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">{achievement.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {achievement.description}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        {new Date(achievement.achievedOn).toLocaleDateString("en-IN", { 
                          month: "short", 
                          day: "numeric" 
                        })}
                      </Badge>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No achievements yet. Keep trading to unlock badges!
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              No gamification data available.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
