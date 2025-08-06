// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";

contract AcademicChainDAO is Governor, GovernorSettings, GovernorCountingSimple, GovernorVotes {
    constructor(IVotes _token)
        Governor("AcademicChainDAO")
        GovernorSettings(
            1,  /* 1 bloque para votación */
            50400,  /* 1 semana en bloques */
            0 /* 0 tokens necesarios para proponer */
        )
        GovernorVotes(_token)
    {}

    function votingDelay() public view override(IGovernor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    function votingPeriod() public view override(IGovernor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber) public pure override returns (uint256) {
        return 1000 * 1e18; // 1000 tokens para quórum
    }

    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }

    // Funciones específicas del DAO
    function proposeParameterChange(
        string memory parameterName,
        uint256 newValue
    ) public returns (uint256) {
        bytes memory data = abi.encodeWithSignature(
            "setParameter(string,uint256)",
            parameterName,
            newValue
        );
        return propose(
            new address[](1), // 1 contrato de destino
            new uint256[](1), // 0 ETH a enviar
            new bytes[](1)(data),
            string(abi.encodePacked("Change ", parameterName, " to ", newValue))
        );
    }
}
