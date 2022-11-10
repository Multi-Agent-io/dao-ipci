pragma solidity ^0.4.18;

import './Object.sol';

/**
 * @title Owned contract modificator
 * @dev   It's abstract contract is a way to make some actions with `Owned` contract delayed.
 *        The use case typically have three steps:
 *          - create modify contract with owned target
 *          - (optional) setup `Modify` contract
 *          - delegate owned contract to `Modify` and `run()` modification
 */
contract Modify is Object {
    Owned public target;

    /**
     * @dev Contract constructor
     * @param _target is a owned target of modification
     */
    function Modify(Owned _target) public
    { target = _target; }

    /**
     * @dev Modification runner
     * @notice the `target` should be delegated to this first
     */
    function run() public onlyOwner {
        require(target.owner() == address(this));

        modify();
        target.setOwner(msg.sender);
    }

    function modify() internal;
}
