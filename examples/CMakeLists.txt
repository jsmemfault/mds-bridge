# MDS (Memfault Diagnostic Service) Examples

# MDS gateway - uploads diagnostic chunks to Memfault cloud
add_executable(mds_gateway mds_gateway.c)
target_link_libraries(mds_gateway PRIVATE memfault_hid)

# MDS stream monitor - displays diagnostic stream data
add_executable(mds_monitor mds_monitor.c)
target_link_libraries(mds_monitor PRIVATE memfault_hid)

# Install examples (optional)
install(TARGETS mds_gateway mds_monitor
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}/memfault_hid_examples
)
