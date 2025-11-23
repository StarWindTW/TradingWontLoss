import { Box, HStack, Text, Avatar, VStack } from "@chakra-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { LuChevronDown, LuCheck } from "react-icons/lu";

const MotionBox = motion(Box);

interface Server {
    id: string;
    name: string;
    icon: string | null;
}

interface SelectorProps {
    width?: string | number;
    height?: string | number;
    servers: Server[];
    selectedServerId: string;
    onSelect: (serverId: string) => void;
}

export default function ServerSelector({
    width = "200px",
    height = "48px",
    servers = [],
    selectedServerId,
    onSelect
}: SelectorProps) {
    const [isActive, setIsActive] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedServer = servers.find(s => s.id === selectedServerId);

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

    return (
        <Box
            ref={containerRef}
            width={width}
            height={height}
            position="relative"
        >
            <MotionBox
                layout
                initial={false}
                animate={{
                    width: isActive ? "auto" : "100%",
                    height: isActive ? "auto" : "100%",
                    borderRadius: isActive ? "24px" : "100px"
                }}
                transition={{ type: "spring", stiffness: 350, damping: 24 }}
                bg="dcms.panel"
                border="1px solid"
                borderColor="border.emphasized"
                position="absolute"
                cursor={isActive ? "default" : "pointer"}
                onClick={() => !isActive && setIsActive(true)}
                zIndex={isActive ? 50 : 0}
                overflow="hidden"
            >
                <AnimatePresence>
                    {!isActive && (
                        <motion.div
                            key="selector"
                            initial={{ opacity: 0, filter: 'blur(8px)' }}
                            animate={{ opacity: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, filter: 'blur(8px)' }}
                            style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 }}
                        >
                            <HStack px={2} pr={4} height="100%" justify="space-between" width="100%">
                                <HStack gap={2}>
                                    {selectedServer ? (
                                        <>
                                            <Avatar.Root colorPalette="bg" size="xs">
                                                <Avatar.Image src={selectedServer.icon || undefined} />
                                                <Avatar.Fallback>{selectedServer.name[0]}</Avatar.Fallback>
                                            </Avatar.Root>
                                            <Text truncate>{selectedServer.name}</Text>
                                        </>
                                    ) : (
                                        <Text pl={2} color="fg.muted">選擇伺服器</Text>
                                    )}
                                </HStack>
                                <LuChevronDown />
                            </HStack>
                        </motion.div>
                    )}
                    {isActive && (
                        <motion.div
                            key="menu"
                            initial={{ opacity: 0, filter: "blur(15px)" }}
                            animate={{ opacity: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, filter: "blur(15px)" }}
                        >
                            <VStack align="stretch" gap={0} p={2} maxH="300px" overflowY="auto">
                                {servers.map(server => (
                                    <HStack
                                        key={server.id}
                                        px={2}
                                        pr={4}
                                        py={2}
                                        rounded="2xl"
                                        cursor="pointer"
                                        _hover={{ bg: "bg.subtle" }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelect(server.id);
                                            setIsActive(false);
                                        }}
                                    >
                                        <Avatar.Root colorPalette="bg" size="xs">
                                            <Avatar.Image src={server.icon || undefined} />
                                            <Avatar.Fallback>{server.name[0]}</Avatar.Fallback>
                                        </Avatar.Root>
                                        <HStack gap={2} justifyContent="space-between" width="100%">
                                            <Text flex={1} whiteSpace="nowrap">{server.name}</Text>
                                            {selectedServerId === server.id &&
                                                <Box><LuCheck color="green" /></Box>
                                            }
                                        </HStack>
                                    </HStack>
                                ))}
                            </VStack>
                        </motion.div>
                    )}
                </AnimatePresence>
            </MotionBox>
        </Box>
    );
}

{/* <ChakraField.Root required>
    <ChakraField.Label>選擇伺服器</ChakraField.Label>
    <MenuRoot positioning={{ sameWidth: true }}>
        <MenuTrigger asChild>
            <Button variant="outline" width="full" justifyContent="space-between">
                <HStack gap={2}>
                    {servers.find(s => s.id === formData.serverId) ? (
                        <>
                            <Avatar.Root size="xs">
                                <Avatar.Image src={servers.find(s => s.id === formData.serverId)?.icon || undefined} />
                                <Avatar.Fallback>{servers.find(s => s.id === formData.serverId)?.name?.[0]}</Avatar.Fallback>
                            </Avatar.Root>
                            <Text>{servers.find(s => s.id === formData.serverId)?.name}</Text>
                        </>
                    ) : (
                        <Text color="fg.muted">選擇伺服器</Text>
                    )}
                </HStack>
                <LuChevronDown />
            </Button>
        </MenuTrigger>
        <MenuContent>
            {servers.map(server => (
                <MenuItem
                    key={server.id}
                    value={server.id}
                    onClick={() => {
                        setFormData(prev => ({
                            ...prev,
                            serverId: server.id,
                            channelId: ''
                        }));
                    }}
                    cursor="pointer"
                >
                    <HStack gap={2} width="full">
                        <Avatar.Root size="xs">
                            <Avatar.Image src={server.icon || undefined} />
                            <Avatar.Fallback>{server.name[0]}</Avatar.Fallback>
                        </Avatar.Root>
                        <Text>{server.name}</Text>
                        {formData.serverId === server.id && <Box ml="auto"><FaCheckCircle color="green" /></Box>}
                    </HStack>
                </MenuItem>
            ))}
        </MenuContent>
    </MenuRoot>
</ChakraField.Root> */}