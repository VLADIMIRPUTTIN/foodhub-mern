import { motion, AnimatePresence } from "framer-motion";

const TermsAndConditionsModal = ({ isOpen, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    onClick={onClose}
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.5)",
                        backdropFilter: "blur(5px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 3000,
                        padding: "1rem",
                        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.96 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: "linear-gradient(135deg, #ffe1b8 0%, #f7c187 100%)",
                            borderRadius: "18px",
                            boxShadow: "0 15px 40px rgba(0,0,0,0.15), 0 4px 12px rgba(207,153,108,0.2), inset 0 1px 0 rgba(255,255,255,0.4)",
                            maxWidth: "620px",
                            width: "100%",
                            maxHeight: "88vh",
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                            position: "relative",
                        }}
                    >
                        {/* ── Close Button ── */}
                        <motion.button
                            onClick={onClose}
                            whileHover={{ scale: 1.1, rotate: 3 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                position: "absolute",
                                top: "0.8rem",
                                right: "0.8rem",
                                background: "rgba(247, 193, 135, 0.8)",
                                border: "1px solid rgba(201,122,43,0.2)",
                                borderRadius: "8px",
                                width: "30px",
                                height: "30px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#c97a2b",
                                cursor: "pointer",
                                zIndex: 10,
                                boxShadow: "0 3px 8px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.3)",
                                fontSize: "1rem",
                            }}
                            aria-label="Close"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </motion.button>

                        {/* ── Header ── */}
                        <div style={{
                            padding: "1.5rem 1.5rem 1rem",
                            borderBottom: "1px solid rgba(201,122,43,0.15)",
                            position: "relative",
                            textAlign: "center",
                        }}>
                            <div style={{ fontSize: "2rem", marginBottom: "0.4rem", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }}>
                                📜
                            </div>
                            <h3 style={{
                                fontFamily: "'Playfair Display', serif",
                                fontSize: "1.5rem",
                                fontWeight: 700,
                                color: "#e26a00",
                                margin: "0 0 0.25rem",
                                letterSpacing: "-0.02em",
                                textShadow: "0 1px 1px rgba(255,255,255,0.5)",
                            }}>
                                Terms & Conditions
                            </h3>
                            <p style={{
                                color: "#b86b1b",
                                fontSize: "0.8rem",
                                margin: 0,
                                fontStyle: "italic",
                                opacity: 0.8,
                            }}>
                                Please read carefully before continuing
                            </p>
                            {/* gradient rule */}
                            <div style={{
                                position: "absolute",
                                bottom: -1,
                                left: "10%",
                                right: "10%",
                                height: "1px",
                                background: "linear-gradient(90deg, transparent, rgba(201,122,43,0.3), transparent)",
                            }} />
                        </div>

                        {/* ── Scrollable Content ── */}
                        <div style={{
                            padding: "1rem 1.5rem",
                            overflowY: "auto",
                            flex: 1,
                            scrollbarWidth: "thin",
                            scrollbarColor: "rgba(226,106,0,0.4) transparent",
                        }}>
                            <Section number="1" title="Account Policies">
                                <p>By creating an account on FoodHub, you agree to abide by these terms and conditions. Violation may result in account suspension or termination.</p>
                            </Section>

                            <Section number="2" title="Content Guidelines">
                                <p>Users are prohibited from posting:</p>
                                <ul>
                                    <li>Offensive, inappropriate, or harmful recipes</li>
                                    <li>Content that promotes harmful activities</li>
                                    <li>Recipes with inappropriate names, descriptions, or images</li>
                                    <li>Misleading or false information about food or nutrition</li>
                                </ul>
                                <WarningBox>
                                    ⚠️ Violation of content guidelines may result in immediate account suspension or permanent banning, at the discretion of FoodHub administrators.
                                </WarningBox>
                            </Section>

                            <Section number="3" title="Account Suspension & Banning">
                                <p>FoodHub reserves the right to:</p>
                                <ul>
                                    <li>Temporarily suspend accounts for minor violations <Tag>1 hour – 30 days</Tag></li>
                                    <li>Permanently ban accounts for serious or repeated violations</li>
                                    <li>Remove any content that violates our guidelines without prior notice</li>
                                </ul>
                                <p>Suspended users will be notified of their suspension duration and reason.</p>
                            </Section>

                            <Section number="4" title="User Responsibilities">
                                <p>Users are responsible for:</p>
                                <ul>
                                    <li>Maintaining the security of their account credentials</li>
                                    <li>All content posted under their account</li>
                                    <li>Reporting inappropriate content posted by others</li>
                                    <li>Ensuring recipes comply with food safety guidelines</li>
                                </ul>
                            </Section>

                            <Section number="5" title="Privacy Policy">
                                <p>By using FoodHub, you consent to our collection and processing of your personal information as described in our Privacy Policy.</p>
                            </Section>

                            <Section number="6" title="Modifications to Terms">
                                <p>FoodHub reserves the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the modified terms.</p>
                            </Section>
                        </div>

                        {/* ── Footer ── */}
                        <div style={{
                            display: "flex",
                            gap: "0.7rem",
                            justifyContent: "flex-end",
                            padding: "1rem 1.5rem 1.3rem",
                            borderTop: "1px solid rgba(201,122,43,0.15)",
                            background: "rgba(247,193,135,0.15)",
                        }}>
                            <motion.button
                                onClick={onClose}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                style={{
                                    padding: "0.6rem 1.3rem",
                                    background: "rgba(255,248,238,0.8)",
                                    color: "#b86b1b",
                                    border: "1px solid rgba(201,122,43,0.2)",
                                    borderRadius: "10px",
                                    fontSize: "0.82rem",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    fontFamily: "'Inter', sans-serif",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)",
                                    transition: "all 0.2s ease",
                                }}
                            >
                                Cancel
                            </motion.button>

                            <motion.button
                                onClick={onClose}
                                whileHover={{ scale: 1.02, y: -1 }}
                                whileTap={{ scale: 0.97 }}
                                style={{
                                    padding: "0.6rem 1.6rem",
                                    background: "linear-gradient(135deg, #e09f56, #d35400)",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "10px",
                                    fontSize: "0.85rem",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    fontFamily: "'Inter', sans-serif",
                                    boxShadow: "0 8px 20px rgba(226,106,0,0.3), 0 2px 5px rgba(226,106,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3)",
                                    letterSpacing: "0.025em",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.4rem",
                                }}
                            >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                I Agree
                            </motion.button>
                        </div>

                        {/* scrollbar webkit fix */}
                        <style>{`
                            .terms-scroll::-webkit-scrollbar { width: 5px; }
                            .terms-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.2); border-radius: 10px; }
                            .terms-scroll::-webkit-scrollbar-thumb { background: rgba(226,106,0,0.4); border-radius: 10px; }
                            .terms-scroll::-webkit-scrollbar-thumb:hover { background: rgba(226,106,0,0.6); }
                        `}</style>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

/* ── Section Card ── */
const Section = ({ number, title, children }) => (
    <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: number * 0.05 }}
        style={{
            background: "rgba(255,248,238,0.8)",
            border: "1px solid rgba(201,122,43,0.12)",
            borderRadius: "12px",
            padding: "0.85rem 1rem",
            marginBottom: "0.7rem",
            boxShadow: "0 2px 5px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.9)",
        }}
    >
        {/* Section title row */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.55rem" }}>
            <span style={{
                background: "rgba(226,106,0,0.12)",
                color: "#e26a00",
                fontSize: "0.68rem",
                fontWeight: 700,
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                border: "1px solid rgba(226,106,0,0.2)",
            }}>
                {number}
            </span>
            <h4 style={{
                fontFamily: "'Playfair Display', serif",
                color: "#e26a00",
                fontSize: "0.92rem",
                fontWeight: 700,
                margin: 0,
                letterSpacing: "0.01em",
            }}>
                {title}
            </h4>
        </div>

        {/* children — inject shared text styles */}
        <div style={{
            color: "#7a5a36",
            fontSize: "0.8rem",
            lineHeight: 1.6,
        }}>
            {children}
        </div>
    </motion.div>
);

/* ── Warning Box ── */
const WarningBox = ({ children }) => (
    <div style={{
        background: "linear-gradient(135deg, rgba(226,106,0,0.08), rgba(184,107,27,0.12))",
        border: "1px solid rgba(201,122,43,0.2)",
        borderLeft: "3px solid #e26a00",
        borderRadius: "8px",
        padding: "0.65rem 0.85rem",
        color: "#b86b1b",
        fontSize: "0.78rem",
        lineHeight: 1.55,
        marginTop: "0.5rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
    }}>
        {children}
    </div>
);

/* ── Inline Tag ── */
const Tag = ({ children }) => (
    <span style={{
        background: "rgba(226,106,0,0.1)",
        color: "#e26a00",
        fontSize: "0.7rem",
        padding: "0.1rem 0.45rem",
        borderRadius: "20px",
        border: "1px solid rgba(226,106,0,0.2)",
        fontWeight: 600,
        whiteSpace: "nowrap",
        marginLeft: "0.3rem",
    }}>
        {children}
    </span>
);

export default TermsAndConditionsModal;