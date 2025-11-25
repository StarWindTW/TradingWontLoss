import { Box, HStack, Text } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { LuTrendingUp, LuTrendingDown } from "react-icons/lu";

interface PositionSelectorProps {
    value: 'long' | 'short';
    onChange: (value: 'long' | 'short') => void;
}

export default function PositionSelector({ value, onChange }: PositionSelectorProps) {
    return (
        <Box 
            bg="dcms.panel" 
            p={1} 
            borderRadius="2xl" 
            width="full" 
            border="1px solid" 
            borderColor="border.emphasized"
            position="relative"
        >
            {/* Moving Background Pill */}
            <motion.div
                layout
                transition={{ 
                    left: { type: "spring", stiffness: 500, damping: 30 },
                    width: { duration: 0.3 },
                    backgroundColor: { duration: 0.2 }
                }}
                animate={{
                    left: value === 'long' ? '4px' : '50%',
                    width: ["calc(50% - 4px)", "calc(52% - 4px)", "calc(50% - 4px)"],
                    backgroundColor: value === 'long' ? 'var(--chakra-colors-green-500)' : 'var(--chakra-colors-red-500)'
                }}
                style={{
                    position: 'absolute',
                    top: '4px',
                    bottom: '4px',
                    width: 'calc(50% - 4px)',
                    borderRadius: 'var(--chakra-radii-xl)',
                    zIndex: 0,
                }}
            />

            <HStack gap={0} position="relative" zIndex={1}>
                {/* Long Option */}
                <Box
                    flex={1}
                    cursor="pointer"
                    onClick={() => onChange('long')}
                    py={2}
                    textAlign="center"
                >
                    <motion.div
                        initial={false}
                        animate={{ color: value === 'long' ? 'white' : 'var(--chakra-colors-fg-muted)' }}
                        transition={{ duration: 0.3 }}
                    >
                        <HStack justify="center" gap={2}>
                            <LuTrendingUp />
                            <Text fontWeight="medium">做多</Text>
                        </HStack>
                    </motion.div>
                </Box>

                {/* Short Option */}
                <Box
                    flex={1}
                    cursor="pointer"
                    onClick={() => onChange('short')}
                    py={2}
                    textAlign="center"
                >
                    <motion.div
                        initial={false}
                        animate={{ color: value === 'short' ? 'white' : 'var(--chakra-colors-fg-muted)' }}
                        transition={{ duration: 0.3 }}
                    >
                        <HStack justify="center" gap={2}>
                            <LuTrendingDown />
                            <Text fontWeight="medium">做空</Text>
                        </HStack>
                    </motion.div>
                </Box>
            </HStack>
        </Box>
    );
}
