import { Avatar, Box, VStack, Text, Button, HStack, Separator } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { LuLogOut, LuSettings, LuChevronLeft, LuSun, LuMoon, LuMonitor, LuCheck } from "react-icons/lu";
import { useColorMode } from "./ui/color-mode";

const MotionBox = motion(Box);

export default function TestAnimation() {
    const { data: session } = useSession();
    const { colorMode, setColorMode } = useColorMode();
    const [isActive, setIsActive] = useState(false);
    const [menuView, setMenuView] = useState("main");
    const containerRef = useRef<HTMLDivElement>(null);
    const prevActiveRef = useRef(isActive);

    useEffect(() => {
        prevActiveRef.current = isActive;
    }, [isActive]);

    useEffect(() => {
        if (!isActive) {
            const timer = setTimeout(() => setMenuView("main"), 200);
            return () => clearTimeout(timer);
        }
    }, [isActive]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsActive(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    if (session == null) {
        return <Box>Please log in to see the animation.</Box>
    }

    return (
        <Box
            ref={containerRef}
            position="absolute"
            top={-2}
            right={0}
            zIndex={1000}
        >
            <MotionBox
                layout
                initial={false}
                animate={{
                    width: isActive ? 240 : 48,
                    height: isActive ? "auto" : 48,
                    borderRadius: isActive ? "24px" : "50%",
                }}
                transition={
                    (isActive !== prevActiveRef.current) ? {
                        type: "spring",
                        stiffness: 350,
                        damping: 26
                    } : {
                        type: "tween",
                        ease: "easeOut",
                        duration: 0.2
                    }
                }
                bg="dcms.panel"
                border="1px solid"
                borderColor={isActive ? "border.emphasized" : "transparent"}
                overflow="hidden"
                shadow={isActive ? "4px 4px 14px rgba(0, 0, 0, 0.2)" : "none"}
                cursor={isActive ? "default" : "pointer"}
                onClick={() => !isActive && setIsActive(true)}
                position="relative"
            >
                <AnimatePresence>
                    {!isActive && (
                        <motion.div
                            key="avatar"
                            initial={{ opacity: 1, filter: "blur(8px)" }}
                            animate={{ opacity: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, filter: "blur(8px)" }}
                            transition={{ duration: 0.1 }}
                            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Avatar.Root size="xl" pointerEvents="none">
                                <Avatar.Image src={session.user?.image || undefined} />
                                <Avatar.Fallback>{session.user?.name?.charAt(0).toUpperCase()}</Avatar.Fallback>
                            </Avatar.Root>
                        </motion.div>
                    )}

                    {isActive && (
                        <motion.div
                            key="menu"
                            initial={{ filter: "blur(15px)" }}
                            animate={{ filter: "blur(0px)" }}
                            exit={{ filter: "blur(15px)" }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            style={{ width: "100%" }}
                        >
                            <VStack align="stretch" p={2} gap={2}>
                                <motion.div layout>
                                    <HStack textAlign="center" p={2} gapX={4}>
                                        <Avatar.Root size="xl">
                                            <Avatar.Image src={session.user?.image || undefined} />
                                            <Avatar.Fallback>{session.user?.name?.charAt(0).toUpperCase()}</Avatar.Fallback>
                                        </Avatar.Root>
                                        <Text fontWeight="bold">{session.user?.name}</Text>
                                    </HStack>
                                </motion.div>
                                <motion.div layout>
                                    <Separator borderColor="border.emphasized" />
                                </motion.div>
                                <motion.div layout="position" style={{ position: "relative", overflow: "hidden" }}>
                                    <AnimatePresence mode="popLayout" initial={false}>
                                        {menuView === "main" ? (
                                            <motion.div
                                                key="main"
                                                initial={{ x: -20, opacity: 0, filter: "blur(10px)" }}
                                                animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
                                                exit={{ x: -20, opacity: 0, filter: "blur(10px)" }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <VStack align="stretch" gap={1}>
                                                    <Button variant="ghost" justifyContent="flex-start" rounded="2xl" onClick={() => setMenuView("settings")}>
                                                        <LuSettings /> 設定
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        justifyContent="flex-start"
                                                        colorPalette="red"
                                                        rounded="2xl"
                                                        onClick={(e) => { e.stopPropagation(); signOut(); }}
                                                    >
                                                        <LuLogOut /> 登出
                                                    </Button>
                                                </VStack>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="settings"
                                                initial={{ x: 20, opacity: 0, filter: "blur(10px)" }}
                                                animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
                                                exit={{ x: 20, opacity: 0, filter: "blur(10px)" }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <VStack align="stretch" gap={1}>
                                                    <Button variant="ghost" rounded="2xl" justifyContent="flex-start" onClick={() => setMenuView("main")}>
                                                        <LuChevronLeft /> 返回
                                                    </Button>
                                                    {[
                                                        { value: "light", label: "淺色模式", icon: LuSun },
                                                        { value: "dark", label: "深色模式", icon: LuMoon },
                                                        { value: "system", label: "跟隨系統", icon: LuMonitor },
                                                    ].map((item) => (
                                                        <Button
                                                            key={item.value}
                                                            variant="ghost"
                                                            justifyContent="flex-start"
                                                            rounded="2xl"
                                                            onClick={() => setColorMode(item.value as any)}
                                                        >
                                                            <HStack width="100%" justifyContent="space-between">
                                                                <HStack>
                                                                    <item.icon /> {item.label}
                                                                </HStack>
                                                                {colorMode === item.value && <LuCheck />}
                                                            </HStack>
                                                        </Button>
                                                    ))}
                                                </VStack>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            </VStack>
                        </motion.div>
                    )}
                </AnimatePresence>
            </MotionBox>
        </Box>
    )
}