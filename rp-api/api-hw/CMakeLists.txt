cmake_minimum_required(VERSION 3.14)
project(rp-hw)


option(BUILD_SHARED "Builds shared library" ON)
option(BUILD_STATIC "Builds static library" ON)
option(IS_INSTALL "Install library" ON)

set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/output)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/output)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/output)
set(CMAKE_C_COMPILER "gcc")
set(CMAKE_CXX_COMPILER "g++")
set(CMAKE_CXX_STANDARD 11)
set(C_STANDARD 11)

if(NOT DEFINED MODEL)
  set(MODEL ANY)
endif()

if(NOT DEFINED INSTALL_DIR)
    message(WARNING,"Installation path not set. Installation will be skipped")
    set(IS_INSTALL OFF)
endif()

message(STATUS "RedPitaya model=${MODEL}")
message(STATUS "Compiler С path: ${CMAKE_C_COMPILER}")
message(STATUS "Compiler С ID: ${CMAKE_C_COMPILER_ID}")
message(STATUS "Compiler С version: ${CMAKE_C_COMPILER_VERSION}")
message(STATUS "Compiler С is part: ${CMAKE_COMPILER_IS_GNUC}")

message(STATUS "Compiler С++ path: ${CMAKE_CXX_COMPILER}")
message(STATUS "Compiler С++ ID: ${CMAKE_CXX_COMPILER_ID}")
message(STATUS "Compiler С++version: ${CMAKE_CXX_COMPILER_VERSION}")
message(STATUS "Compiler С++ is part: ${CMAKE_COMPILER_IS_GNUCXX}")
message(STATUS "Install path ${INSTALL_DIR}")


include_directories("include")
include_directories("src")

file(GLOB PR_HW_SOURCES "src/*.c")

add_compile_options(-mcpu=cortex-a9 -mfpu=neon-fp16 -fPIC)
add_compile_definitions(ARCH_ARM)
add_compile_options(-std=c11 -Wall -pedantic -Wextra -D${MODEL} $<$<CONFIG:Debug>:-g3> $<$<CONFIG:Release>:-Os> -ffunction-sections -fdata-sections)

add_library(${PROJECT_NAME}-obj OBJECT ${PR_HW_SOURCES})

if(BUILD_SHARED)
    add_library(${PROJECT_NAME}-shared SHARED)
    set_property(TARGET ${PROJECT_NAME}-shared PROPERTY OUTPUT_NAME ${PROJECT_NAME})
    target_link_options(${PROJECT_NAME}-shared PRIVATE -shared -Wl,--version-script=src/exportmap)
    target_sources(${PROJECT_NAME}-shared PRIVATE $<TARGET_OBJECTS:${PROJECT_NAME}-obj>)

    if(IS_INSTALL)
        install(TARGETS ${PROJECT_NAME}-shared
            LIBRARY DESTINATION ${INSTALL_DIR}/lib
            ARCHIVE DESTINATION ${INSTALL_DIR}/lib)
        install(DIRECTORY ${CMAKE_SOURCE_DIR}/include
            DESTINATION ${INSTALL_DIR} PATTERN "*.h")            
    endif()         
endif()


if(BUILD_STATIC)
    add_library(${PROJECT_NAME}-static STATIC)
    set_property(TARGET ${PROJECT_NAME}-static PROPERTY OUTPUT_NAME ${PROJECT_NAME})
    target_sources(${PROJECT_NAME}-static PRIVATE $<TARGET_OBJECTS:${PROJECT_NAME}-obj>)

    if(IS_INSTALL)
        install(TARGETS ${PROJECT_NAME}-static
            LIBRARY DESTINATION ${INSTALL_DIR}/lib
            ARCHIVE DESTINATION ${INSTALL_DIR}/lib)
        install(DIRECTORY ${CMAKE_SOURCE_DIR}/include
            DESTINATION ${INSTALL_DIR} PATTERN "*.h") 
        endif()  
endif()

unset(MODEL CACHE)
unset(INSTALL_DIR CACHE)