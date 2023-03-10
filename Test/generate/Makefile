##
# $Id: Makefile 1249 2014-02-22 20:21:40Z ales.bardorfer $
#
# (c) Red Pitaya  http://www.redpitaya.com
#
# Signal generator project file. To build executable for Signal generator run:
# 'make all'
#
# This project file is written for GNU/Make software. For more details please 
# visit: http://www.gnu.org/software/make/manual/make.html
# GNU Compiler Collection (GCC) tools are used for the compilation and linkage. 
# For the details about the usage and building please visit:
# http://gcc.gnu.org/onlinedocs/gcc/
#

MODEL ?= Z10

# Versioning system
VERSION ?= 0.00-0000
REVISION ?= devbuild

# List of compiled object files (not yet linked to executable)
OBJS = fpga_awg.o main.o
ifeq ($(MODEL),Z20_250_12)
	OBJS += generate_250.o
else
	OBJS += generate.o
endif

# List of raw source files (all object files, renamed from .o to .c)
SRCS = $(subst .o,.cpp, $(OBJS)))

# Executable name
TARGET=generate

# GCC compiling & linking flags
CXXFLAGS  = -Wall -Werror -Wno-unused
CXXFLAGS += -I$(INSTALL_DIR)/include
CXXFLAGS += -DVERSION=$(VERSION) -DREVISION=$(REVISION) -D$(MODEL)

# Additional libraries which needs to be dynamically linked to the executable
# -lm - System math library (used by cos(), sin(), sqrt(), ... functions)
LIBS = -L$(INSTALL_DIR)/lib -static -lrp -lm

ifeq ($(MODEL),Z20_250_12)
LIBS += -L$(INSTALL_DIR)/lib -static -lrp-i2c -static -lrp-gpio -static -lrp-spi -lrp-hw -lstdc++ -lpthread
CXXFLAGS += -I$(INSTALL_DIR)/include/api250-12
endif

# Main GCC executable (used for compiling and linking)
CC=$(CROSS_COMPILE)gcc
# Installation directory
INSTALL_DIR ?= .

# Makefile is composed of so called 'targets'. They give basic structure what 
# needs to be execued during various stages of the building/removing/installing
# of software package.
# Simple Makefile targets have the following structure:
# <name>: <dependencies>
#	<command1>
#       <command2>
#       ...
# The target <name> is completed in the following order:
#   - list od <dependencies> finished
#   - all <commands> in the body of targets are executed succsesfully

# Main Makefile target 'all' - it iterates over all targets listed in $(TARGET)
# variable.
all: $(TARGET)

# Target with compilation rules to compile object from source files.
# It applies to all files ending with .o. During partial building only new object
# files are created for the source files (.c) which have newer timestamp then 
# objects (.o) files.
%.o: %.c
	$(CC) -c $(CXXFLAGS) $< -o $@

# Makefile target with rules how to link executable for each target from $(TARGET)
# list.
$(TARGET): $(OBJS)
	$(CC) -o $@ $^ $(CXXFLAGS) $(LIBS)

# Clean target - when called it cleans all object files and executables.
clean:
	rm -f $(TARGET) *.o

# Install target - creates 'bin/' sub-directory in $(INSTALL_DIR) and copies all
# executables to that location.
install:
	mkdir -p $(INSTALL_DIR)/bin
	cp $(TARGET) $(INSTALL_DIR)/bin
