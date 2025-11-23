'use client';

import { motion } from 'framer-motion';

export default function Template({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ ease: 'easeOut', duration: 0.4 }}
            style={{ width: '100%', height: '100%' }}
        >
            {children}
        </motion.div>
    );
}
