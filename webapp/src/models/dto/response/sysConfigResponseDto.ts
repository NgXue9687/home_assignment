import { SysConfigEntity } from "../../entity/sysconfig.entity.js"


export type SysConfigResponseDto ={
    sysConfigKey: string, 
    sysConfigValue: string
}

export function toSysConfigResponse(sysConfig: SysConfigEntity): SysConfigResponseDto {
    return{
        sysConfigKey: sysConfig.sysConfigName,
        sysConfigValue: sysConfig.sysConfigValue
    }
}