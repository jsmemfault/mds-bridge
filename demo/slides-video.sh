#!/bin/bash
#
# Auto-advancing slides for CES 2026 demo video (tmux version)
#
# This script runs slides in a tmux session with auto-advance.
# Perfect for recording or displaying above a demo station.
#
# Usage:
#   ./slides-video.sh [seconds-per-slide]
#
# Default: 6 seconds per slide (10 slides = 60 seconds total loop)
#
# To record: use asciinema, ttyrec, or OBS to capture the terminal
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SLIDES_FILE="${SCRIPT_DIR}/slides.md"
SECONDS_PER_SLIDE="${1:-6}"
NUM_SLIDES=10
SESSION_NAME="mds-demo-slides"

# Colors
CYAN='\033[1;36m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
RESET='\033[0m'

# Check dependencies
check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "${YELLOW}Required command not found: $1${RESET}"
        echo ""
        case "$1" in
            slides)
                echo "Install with:"
                echo "  brew install slides"
                echo "  # or"
                echo "  go install github.com/maaslalani/slides@latest"
                ;;
            tmux)
                echo "Install with:"
                echo "  brew install tmux"
                echo "  # or"
                echo "  apt-get install tmux"
                ;;
        esac
        exit 1
    fi
}

check_command slides
check_command tmux

# Check for slides file
if [ ! -f "$SLIDES_FILE" ]; then
    echo -e "${YELLOW}Slides file not found: ${SLIDES_FILE}${RESET}"
    exit 1
fi

# Kill any existing session
tmux kill-session -t "$SESSION_NAME" 2>/dev/null || true

echo -e "${CYAN}╔═══════════════════════════════════════════════════════════╗${RESET}"
echo -e "${CYAN}║       MDS DEMO - AUTO-ADVANCING VIDEO LOOP (tmux)        ║${RESET}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "  Slides file:     ${GREEN}${SLIDES_FILE}${RESET}"
echo -e "  Seconds/slide:   ${GREEN}${SECONDS_PER_SLIDE}${RESET}"
echo -e "  Loop duration:   ${GREEN}$((SECONDS_PER_SLIDE * NUM_SLIDES)) seconds${RESET}"
echo -e "  tmux session:    ${GREEN}${SESSION_NAME}${RESET}"
echo ""
echo -e "  ${YELLOW}Starting in 2 seconds... Press Ctrl+C to cancel${RESET}"
echo ""
sleep 2

# Create tmux session with slides
tmux new-session -d -s "$SESSION_NAME" -x 60 -y 20 "slides '$SLIDES_FILE'"

# Give slides time to initialize
sleep 1

# Function to advance slides in a loop
advance_loop() {
    while true; do
        # Advance through all slides
        for ((i=1; i<=NUM_SLIDES; i++)); do
            sleep "$SECONDS_PER_SLIDE"
            tmux send-keys -t "$SESSION_NAME" Space
        done

        # Small pause at end, then restart
        sleep 1

        # Jump to first slide (gg = go to beginning)
        tmux send-keys -t "$SESSION_NAME" "gg"
        sleep 0.5
    done
}

# Trap for cleanup
cleanup() {
    echo ""
    echo -e "${CYAN}Stopping...${RESET}"
    tmux kill-session -t "$SESSION_NAME" 2>/dev/null || true
    exit 0
}
trap cleanup INT TERM

# Start the advance loop in background
advance_loop &
LOOP_PID=$!

# Attach to the tmux session (this shows the slides)
echo -e "${GREEN}Attaching to slides... Press Ctrl+B then D to detach, Ctrl+C to stop${RESET}"
echo ""
tmux attach-session -t "$SESSION_NAME"

# If we get here, user detached - kill the loop
kill $LOOP_PID 2>/dev/null || true
tmux kill-session -t "$SESSION_NAME" 2>/dev/null || true

echo ""
echo -e "${CYAN}Session ended.${RESET}"
echo ""
echo "To run in background for recording:"
echo "  1. Run this script"
echo "  2. Press Ctrl+B, then D to detach"
echo "  3. Record the terminal with: asciinema rec demo.cast"
echo "  4. Reattach with: tmux attach -t $SESSION_NAME"
