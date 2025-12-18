#!/bin/bash
#
# Auto-advancing slides loop for CES 2026 demo video
#
# This script runs the slides presentation in a loop with auto-advance.
# Perfect for recording a 60-second video or running above a demo station.
#
# Usage:
#   ./slides-loop.sh [seconds-per-slide]
#
# Default: 6 seconds per slide (10 slides = 60 seconds)
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SLIDES_FILE="${SCRIPT_DIR}/slides.md"
SECONDS_PER_SLIDE="${1:-6}"
NUM_SLIDES=10

# Colors
CYAN='\033[1;36m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
RESET='\033[0m'

# Check for slides command
if ! command -v slides &> /dev/null; then
    echo -e "${YELLOW}The 'slides' command is not installed.${RESET}"
    echo ""
    echo "Install with:"
    echo "  brew install slides"
    echo "  # or"
    echo "  go install github.com/maaslalani/slides@latest"
    echo ""
    exit 1
fi

# Check for slides file
if [ ! -f "$SLIDES_FILE" ]; then
    echo -e "${YELLOW}Slides file not found: ${SLIDES_FILE}${RESET}"
    exit 1
fi

echo -e "${CYAN}╔═══════════════════════════════════════════════════════════╗${RESET}"
echo -e "${CYAN}║         MDS DEMO - AUTO-ADVANCING SLIDE LOOP             ║${RESET}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "  Slides file:     ${GREEN}${SLIDES_FILE}${RESET}"
echo -e "  Seconds/slide:   ${GREEN}${SECONDS_PER_SLIDE}${RESET}"
echo -e "  Total duration:  ${GREEN}$((SECONDS_PER_SLIDE * NUM_SLIDES)) seconds${RESET}"
echo ""
echo -e "  ${YELLOW}Press Ctrl+C to stop${RESET}"
echo ""
sleep 2

# Function to run one loop of the presentation
run_presentation_loop() {
    # Create a named pipe for controlling slides
    FIFO=$(mktemp -u)
    mkfifo "$FIFO"

    # Start slides reading from the pipe for input
    # We use a subshell trick to keep the pipe open
    (
        # Give slides time to start
        sleep 1

        while true; do
            # Advance through all slides
            for ((i=1; i<=NUM_SLIDES; i++)); do
                sleep "$SECONDS_PER_SLIDE"
                echo " "  # Space to advance
            done

            # Jump back to first slide (gg in vim mode)
            echo "gg"
        done
    ) > "$FIFO" &
    INPUT_PID=$!

    # Run slides with input from pipe
    slides "$SLIDES_FILE" < "$FIFO"

    # Cleanup
    kill $INPUT_PID 2>/dev/null || true
    rm -f "$FIFO"
}

# Trap Ctrl+C for clean exit
cleanup() {
    echo ""
    echo -e "${CYAN}Stopping slide loop...${RESET}"
    exit 0
}
trap cleanup INT TERM

# Run the presentation
run_presentation_loop
