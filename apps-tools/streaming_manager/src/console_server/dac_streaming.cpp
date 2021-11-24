#include <vector>
#include "dac_streaming.h"

CDACStreamingApplication *g_dac_app = nullptr;
CDACStreamingManager::Ptr g_dac_manger = nullptr;
CGenerator::Ptr 		gen = nullptr;
std::shared_ptr<ServerNetConfigManager> g_serverDACNetConfig = nullptr;
std::atomic_bool g_dac_serverRun(false);

auto calibDACFullScaleToVoltage(uint32_t fullScaleGain) -> float {
    /* no scale */
    if (fullScaleGain == 0) {
        return 1;
    }
    return (float) ((float)fullScaleGain  * 100.0 / ((uint64_t)1<<32));
}

auto startDACServer(std::shared_ptr<ServerNetConfigManager> serverNetConfig) -> void{
    if (!serverNetConfig) return;
    g_serverDACNetConfig = serverNetConfig;
	try{
		if (!g_serverDACNetConfig->isSetted()) return;
		if (g_dac_serverRun) {
			if (g_dac_manger){
				if (!g_dac_manger->isLocalMode()){
					g_serverDACNetConfig->sendServerStartedUDP();
				}else{
					g_serverDACNetConfig->sendServerStartedSD();
				}
			}
			return;
		}
		g_dac_serverRun = true;
		// TODO make setting for read from lacal file
		auto use_file     =  g_serverDACNetConfig->getDACMode();
		auto sock_port    =  g_serverDACNetConfig->getDACPort();
		auto ip_addr_host = "127.0.0.1";

#ifdef Z20
		auto use_calib    = 0;
		auto attenuator   = 0;
#else
		// TODO make settings for use calibration
		auto use_calib    = g_serverDACNetConfig->getCalibration();
		rp_CalibInit();
		auto osc_calib_params = rp_GetCalibrationSettings();
#endif

#ifdef Z20_250_12
		auto dac_gain = g_serverDACNetConfig->getDACGain();
#endif

		std::vector<UioT> uioList = GetUioList();
		uint32_t ch1_off = 0;
		uint32_t ch2_off = 0;
		float ch1_gain = 1;
		float ch2_gain = 1;

		if (use_calib == 1) {
#ifdef Z20_250_12
			if (dac_gain == CStreamSettings::x1) {			
				ch1_gain = calibDACFullScaleToVoltage(osc_calib_params.gen_ch1_g_1);  
				ch2_gain = calibDACFullScaleToVoltage(osc_calib_params.gen_ch2_g_1);  
				ch1_off  = osc_calib_params.gen_ch1_off_1;
				ch2_off  = osc_calib_params.gen_ch2_off_1;
			}else{
				ch1_gain = calibDACFullScaleToVoltage(osc_calib_params.gen_ch1_g_5);  
				ch2_gain = calibDACFullScaleToVoltage(osc_calib_params.gen_ch2_g_5);  
				ch1_off  = osc_calib_params.gen_ch1_off_5;
				ch2_off  = osc_calib_params.gen_ch2_off_5;
			}
#endif

#if defined Z10 || defined Z20_125
			ch1_gain = calibDACFullScaleToVoltage(osc_calib_params.be_ch1_fs);
			ch2_gain = calibDACFullScaleToVoltage(osc_calib_params.be_ch2_fs);
			ch1_off  = osc_calib_params.be_ch1_dc_offs;
			ch2_off  = osc_calib_params.be_ch2_dc_offs;
#endif
		}

#ifdef Z20_250_12

        rp_max7311::rp_setGainOut(RP_MAX7311_OUT1, dac_gain == CStreamSettings::x1 ? RP_GAIN_2V : RP_GAIN_10V);
        rp_max7311::rp_setGainOut(RP_MAX7311_OUT2, dac_gain == CStreamSettings::x1 ? RP_GAIN_2V : RP_GAIN_10V);

#endif

		for (const UioT &uio : uioList)
		{
			 if (uio.nodeName == "rp_dac")
			{
				gen = CGenerator::Create(uio, true , true );
				gen->setCalibration(ch1_off,ch1_gain,ch2_off,ch2_gain);
			}
		}


		if (use_file == CStreamSettings::NET) {
			g_dac_manger = CDACStreamingManager::Create(
					ip_addr_host,
					sock_port);
		}else{
			// auto file_type = Stream_FileType::WAV_TYPE;
			// if (format == CStreamSettings::TDMS) file_type = Stream_FileType::TDMS_TYPE;
			// if (format == CStreamSettings::CSV)  file_type = Stream_FileType::CSV_TYPE;
			// g_manger = CStreamingManager::Create(file_type , FILE_PATH, samples , save_mode == CStreamSettings::VOLT);
			// g_manger->notifyStop = [](int status)
			// 					{
			// 						stopNonBlocking(status == 0 ? 2 : 3);
			// 					};
		}

		if (g_dac_app!= nullptr){
			g_dac_app->stop();
			delete g_dac_app;
		}


		g_dac_app = new CDACStreamingApplication(g_dac_manger, gen);
		

		g_dac_app->runNonBlock();
		if (g_dac_manger->isLocalMode()){
			g_serverDACNetConfig->sendDACServerStartedSD();
		}else{
			g_serverDACNetConfig->sendDACServerStarted();
		}

		fprintf(stdout,"[Streaming] Start dac server\n");
        syslog (LOG_NOTICE, "[Streaming] Start dac server\n");
	}catch (std::exception& e)
	{
		fprintf(stderr, "Error: startDACServer() %s\n",e.what());
        syslog (LOG_ERR,"Error: startDACServer() %s\n",e.what());
	}
}

auto stopDACNonBlocking(int x) -> void{
	try{
		std::thread th(stopDACServer ,x);
		th.detach();
	}catch (std::exception& e)
	{
		fprintf(stderr, "Error: StopNonBlocking() %s\n",e.what());
        syslog (LOG_ERR,"Error: StopNonBlocking() %s\n",e.what());
	}
}


auto stopDACServer(int x) -> void{
	try{
		if (g_dac_app)
		{
			g_dac_app->stop();
			delete g_dac_app;
			g_dac_app = nullptr;
		}
        if (g_serverDACNetConfig){
            switch (x)
            {
            case 0:
                g_serverDACNetConfig->sendDACServerStopped();
                break;
            case 2:
                g_serverDACNetConfig->sendDACServerStoppedSDDone();
                break;
            default:
                throw runtime_error("Unknown state");
                break;
            }
        }
		g_dac_serverRun = false;
        fprintf(stdout,"[Streaming] Stop dac server\n");
        syslog (LOG_NOTICE, "[Streaming] Stop dac server\n");
	}catch (std::exception& e)
	{
		fprintf(stderr, "Error: stopDACServer() %s\n",e.what());
        syslog (LOG_ERR,"Error: stopDACServer() %s\n",e.what());
	}
}