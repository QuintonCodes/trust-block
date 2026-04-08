// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {
        // Mint 1,000,000 USDC to the deployer's wallet initially
        _mint(msg.sender, 1000000 * 10 ** 6);
    }

    // A helper function so anyone can mint fake USDC for testing
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    // Real USDC uses 6 decimals (not 18 like standard ERC20s)
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
}