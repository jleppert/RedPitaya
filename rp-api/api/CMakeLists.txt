cmake_minimum_required(VERSION 3.14)
project(rp)


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
  set(MODEL Z10)
endif()

if(NOT DEFINED INSTALL_DIR)
    message(WARNING,"Installation path not set. Installation will be skipped")
    set(IS_INSTALL OFF)
endif()

if(NOT DEFINED DEBUG_REG)
  set(DEBUG_REG OFF)
endif()


if(NOT DEFINED VERSION)
  set(VERSION 0.00-0000)
endif()

if(NOT DEFINED REVISION)
  set(REVISION devbuild)
endif()


message(STATUS "RedPitaya model=${MODEL}")
message(STATUS "VERSION=${VERSION}")
message(STATUS "REVISION=${REVISION}")

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
include_directories("src/kiss_fft")

list(APPEND src
            ${CMAKE_SOURCE_DIR}/src/common.c
            ${CMAKE_SOURCE_DIR}/src/kiss_fft/kiss_fft.c
            ${CMAKE_SOURCE_DIR}/src/kiss_fft/kiss_fftr.c
            ${CMAKE_SOURCE_DIR}/src/oscilloscope.c
            ${CMAKE_SOURCE_DIR}/src/acq_handler.c
            ${CMAKE_SOURCE_DIR}/src/generate.c
            ${CMAKE_SOURCE_DIR}/src/gen_handler.c
            ${CMAKE_SOURCE_DIR}/src/spec_dsp.c
            ${CMAKE_SOURCE_DIR}/src/rp.c
        )

   
if ("${MODEL}" STREQUAL "Z20_250_12")
    list(APPEND src
        ${CMAKE_SOURCE_DIR}/src/calib_250_12.c
    )
else()
    list(APPEND src
        ${CMAKE_SOURCE_DIR}/src/calib.c
    )
endif()

if ("${MODEL}" STREQUAL "Z10")
    list(APPEND header_rp
        ${CMAKE_SOURCE_DIR}/include/redpitaya/rp.h
    )
endif()

if ("${MODEL}" STREQUAL "Z20")
    list(APPEND header_rp
        ${CMAKE_SOURCE_DIR}/include/redpitaya/rp_Z20.h
    )
endif()

if ("${MODEL}" STREQUAL "Z20_125")
    list(APPEND header_rp
        ${CMAKE_SOURCE_DIR}/include/redpitaya/rp_Z20_125.h
    )
endif()

if ("${MODEL}" STREQUAL "Z20_250_12")
    list(APPEND header_rp
        ${CMAKE_SOURCE_DIR}/include/redpitaya/rp_Z20_250_12.h
    )
endif()

add_compile_options(-mcpu=cortex-a9 -mfpu=neon-fp16 -fPIC)
add_compile_definitions(ARCH_ARM)
add_compile_options(-std=c11 -Wall -pedantic -Wextra -D${MODEL} -DVERSION=${VERSION} -DREVISION=${REVISION} $<$<CONFIG:Debug>:-g3> $<$<CONFIG:Release>:-Os> -ffunction-sections -fdata-sections)

if(DEBUG_REG)
add_compile_options(-DDEBUG_REG)
endif()

add_library(${PROJECT_NAME}-obj OBJECT ${src})

if ("${MODEL}" STREQUAL "Z20_250_12")
    if(NOT DEFINED INSTALL_DIR)
        message(FATAL_ERROR "You must specify the path to the libraries api-250-12")      
    endif()
    include_directories(${INSTALL_DIR}/include/api250-12)
    link_directories(${INSTALL_DIR}/lib)
    target_link_libraries(${PROJECT_NAME}-obj rp-i2c)
endif()

if(BUILD_SHARED)
    add_library(${PROJECT_NAME}-shared SHARED)
    set_property(TARGET ${PROJECT_NAME}-shared PROPERTY OUTPUT_NAME ${PROJECT_NAME})
    target_link_options(${PROJECT_NAME}-shared PRIVATE -shared -Wl,--version-script=src/exportmap)
    target_sources(${PROJECT_NAME}-shared PRIVATE $<TARGET_OBJECTS:${PROJECT_NAME}-obj>)
    target_link_libraries(${PROJECT_NAME}-shared -lm -lpthread)

    if(IS_INSTALL)
        install(TARGETS ${PROJECT_NAME}-shared
            LIBRARY DESTINATION ${INSTALL_DIR}/lib
            ARCHIVE DESTINATION ${INSTALL_DIR}/lib)

        install(FILES ${CMAKE_SOURCE_DIR}/include/redpitaya/version.h
            DESTINATION ${INSTALL_DIR}/include)
        
        install(FILES ${header_rp}
            DESTINATION ${INSTALL_DIR}/include RENAME "rp.h")
    endif()         
endif()


if(BUILD_STATIC)
    add_library(${PROJECT_NAME}-static STATIC)
    set_property(TARGET ${PROJECT_NAME}-static PROPERTY OUTPUT_NAME ${PROJECT_NAME})
    target_sources(${PROJECT_NAME}-static PRIVATE $<TARGET_OBJECTS:${PROJECT_NAME}-obj>)
    target_link_libraries(${PROJECT_NAME}-static -lm -lpthread)

    if(IS_INSTALL)
        install(TARGETS ${PROJECT_NAME}-static
            LIBRARY DESTINATION ${INSTALL_DIR}/lib
            ARCHIVE DESTINATION ${INSTALL_DIR}/lib)
        
        install(FILES ${CMAKE_SOURCE_DIR}/include/redpitaya/version.h
            DESTINATION ${INSTALL_DIR}/include)
        
        install(FILES ${header_rp}
            DESTINATION ${INSTALL_DIR}/include RENAME "rp.h")
    endif()  
endif()

unset(MODEL CACHE)
unset(INSTALL_DIR CACHE)