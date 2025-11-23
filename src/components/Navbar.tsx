"use client";
import { Box, Heading, HStack } from "@chakra-ui/react";
import AuthButton from "./AuthButton";

export default function Navbar() {
    return (
        <HStack justify="space-between" bg="bg.panel" p={2} px={6} borderBottom="1px solid" borderColor={{ base: "gray.200", _dark: "gray.800" }} flexShrink={0} position="relative">
            <Box height="48px" display="flex" alignItems="center">
                <Heading size="xl">
                    TradingWontLoss
                </Heading>
            </Box>
            <AuthButton />
        </HStack>
    );
}