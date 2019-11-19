<?php
/*
 * This file is part of the feed-io package.
 *
 * (c) Alexandre Debril <alex.debril@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace FeedIo\Reader;

use FeedIo\Feed;

class DocumentTest extends \PHPUnit_Framework_TestCase
{
    public function testIsJson()
    {
        $document = new Document('{"json": "value"}');

        $this->assertTrue($document->isJson());
    }

    public function testIsXml()
    {
        $document = new Document('<feed xmlns="http://www.w3.org/2005/Atom"></feed>');

        $this->assertTrue($document->isXml());
    }

    public function testGetJsonAsArray()
    {
        $document = new Document('{"foo": "bar"}');
        $this->assertInternalType('array', $document->getJsonAsArray());
    }

    /**
     * @expectedException \LogicException
     */
    public function testLoadWrongDoucment()
    {
        $document = new Document('something wrong');
        $document->getDOMDocument();
    }

    /**
     * @expectedException \LogicException
     */
    public function testLoadWrongJsonDoucment()
    {
        $document = new Document('something wrong');
        $document->getJsonAsArray();
    }
}
